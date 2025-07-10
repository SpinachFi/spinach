# spinach

# Intro

Spinach is running multiple competitions to boost liquidity in the ecosystem.

Competition can have multiple rewards on multiple chains - in case of main USDGLO competition, we are giving away USDGLO and CELO tokens on the daily basis.

For each competition, based on submissions, for each participant we create Project entities with all the details - project info, logo, urls and payout address.

The data and payouts are collected and processed on the daily basis as described below.

# Cron jobs based architecture

Every day after midnight (UTC) we collect current project liquidity info.

For each competition and each reward we run data collection job that's creating project record entries.

Based on entries we calculate rewards and distribute tokens.

# Error handling

There might be number of issues why the payouts wasn't processed - low token balance, nouce issue etc.

Each job can be repeated from Vercel console. However first each failed payout has to be manually checked and adjusted in db so it's marked for the new job run. Whenever payout fails it will be stuck in `isProcessing` state for manual revision, so the flag has to be set to `False` to be considered for the next run.

# Run cron job locally

```
    curl -H "Authorization: Bearer 1234567890" http://localhost:3000/api/collect/optimism | json_pp
```

# Adding new competition / projects

To start new competition the new record is required to be added in db - competition with at least one reward.

To add new project aka participant for new/existing competition one new db record is needed. Besides cron job with data collection need to be adjusted or created so "project record" with liquidity data is collected on daily basis.
