import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { POINTS_CONFIG, POINT_SOURCES, calculateDailyPoints, calculateDaysHeld } from '@/lib/points';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/lib/constants';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - allowing request in development');
    return process.env.NODE_ENV === 'development';
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting daily points distribution...');
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('wallet_address, total_points');

    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log(`Processing ${users.length} users...`);

    const results = {
      processed: 0,
      pointsAwarded: 0,
      milestonesAwarded: 0,
      errors: 0,
    };

    const now = new Date().toISOString();

    for (const user of users) {
      try {
        // Get current on-chain holdings
        const tokenIds = await contract.tokensOfOwner(user.wallet_address);
        const currentTokenIds = tokenIds.map((id: bigint) => Number(id));

        // Get existing holdings from DB
        const { data: existingHoldings } = await supabaseAdmin
          .from('holdings')
          .select('*')
          .eq('wallet_address', user.wallet_address);

        const existingTokenIds = existingHoldings?.map(h => h.token_id) || [];

        // Mark sold NFTs as not current
        const soldTokenIds = existingTokenIds.filter(id => !currentTokenIds.includes(id));
        if (soldTokenIds.length > 0) {
          await supabaseAdmin
            .from('holdings')
            .update({ is_current: false, last_seen_at: now })
            .eq('wallet_address', user.wallet_address)
            .in('token_id', soldTokenIds);
        }

        // Process current holdings
        let dailyPointsTotal = 0;
        const currentHoldings = [];

        for (const tokenId of currentTokenIds) {
          const existing = existingHoldings?.find(h => h.token_id === tokenId);

          if (existing) {
            // Update existing holding
            await supabaseAdmin
              .from('holdings')
              .update({ is_current: true, last_seen_at: now })
              .eq('id', existing.id);

            currentHoldings.push(existing);
          } else {
            // New holding
            const { data: newHolding } = await supabaseAdmin
              .from('holdings')
              .insert({
                wallet_address: user.wallet_address,
                token_id: tokenId,
                first_seen_at: now,
                last_seen_at: now,
                is_current: true,
              })
              .select()
              .single();

            if (newHolding) {
              currentHoldings.push(newHolding);
            }
          }
        }

        // Calculate daily points
        const nftCount = currentHoldings.length;
        if (nftCount > 0) {
          dailyPointsTotal = calculateDailyPoints(nftCount);

          // Award daily holding points
          await supabaseAdmin.from('points_log').insert({
            wallet_address: user.wallet_address,
            amount: dailyPointsTotal,
            source: POINT_SOURCES.DAILY_HOLDING,
            description: `Daily holding reward for ${nftCount} NFT${nftCount > 1 ? 's' : ''}`,
            metadata: { nft_count: nftCount, points_per_nft: dailyPointsTotal / nftCount },
          });

          results.pointsAwarded += dailyPointsTotal;
        }

        // Check milestones for each holding
        let milestonePointsTotal = 0;
        for (const holding of currentHoldings) {
          const daysHeld = calculateDaysHeld(holding.first_seen_at);

          // 30-day milestone
          if (daysHeld >= 30 && !holding.milestone_30d_awarded) {
            const points = POINTS_CONFIG.MILESTONES[30];
            milestonePointsTotal += points;

            await supabaseAdmin.from('points_log').insert({
              wallet_address: user.wallet_address,
              amount: points,
              source: POINT_SOURCES.MILESTONE_30D,
              description: `30-day holding milestone for Token #${holding.token_id}`,
              metadata: { token_id: holding.token_id, days_held: daysHeld },
            });

            await supabaseAdmin
              .from('holdings')
              .update({ milestone_30d_awarded: true })
              .eq('id', holding.id);

            results.milestonesAwarded++;
          }

          // 90-day milestone
          if (daysHeld >= 90 && !holding.milestone_90d_awarded) {
            const points = POINTS_CONFIG.MILESTONES[90];
            milestonePointsTotal += points;

            await supabaseAdmin.from('points_log').insert({
              wallet_address: user.wallet_address,
              amount: points,
              source: POINT_SOURCES.MILESTONE_90D,
              description: `90-day holding milestone for Token #${holding.token_id}`,
              metadata: { token_id: holding.token_id, days_held: daysHeld },
            });

            await supabaseAdmin
              .from('holdings')
              .update({ milestone_90d_awarded: true })
              .eq('id', holding.id);

            results.milestonesAwarded++;
          }

          // 365-day milestone
          if (daysHeld >= 365 && !holding.milestone_365d_awarded) {
            const points = POINTS_CONFIG.MILESTONES[365];
            milestonePointsTotal += points;

            await supabaseAdmin.from('points_log').insert({
              wallet_address: user.wallet_address,
              amount: points,
              source: POINT_SOURCES.MILESTONE_365D,
              description: `1-year holding milestone for Token #${holding.token_id}`,
              metadata: { token_id: holding.token_id, days_held: daysHeld },
            });

            await supabaseAdmin
              .from('holdings')
              .update({ milestone_365d_awarded: true })
              .eq('id', holding.id);

            results.milestonesAwarded++;
          }
        }

        // Update user's total points
        const totalPointsToAdd = dailyPointsTotal + milestonePointsTotal;
        if (totalPointsToAdd > 0) {
          await supabaseAdmin
            .from('users')
            .update({ 
              total_points: user.total_points + totalPointsToAdd,
              last_seen_at: now 
            })
            .eq('wallet_address', user.wallet_address);
        }

        results.processed++;
      } catch (error) {
        console.error(`Error processing user ${user.wallet_address}:`, error);
        results.errors++;
      }
    }

    console.log('Daily points distribution complete:', results);

    return NextResponse.json({
      success: true,
      results,
      timestamp: now,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for Vercel Cron
export async function POST(request: NextRequest) {
  return GET(request);
}
