/**
 * tRPC Router for Monitoring Jobs
 * Provides endpoints to trigger and schedule automated monitoring tasks
 */

import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import {
  dailyCovenantCheck,
  weeklySupplyRecalculation,
  contractRenewalAlerts,
  runAllMonitoringJobs,
} from './monitoringJobs';

export const monitoringJobsRouter = router({
  // Trigger daily covenant check manually
  triggerCovenantCheck: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger monitoring jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const result = await dailyCovenantCheck();
      return result;
    }),
  
  // Trigger weekly supply recalculation manually
  triggerSupplyRecalc: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger monitoring jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const result = await weeklySupplyRecalculation();
      return result;
    }),
  
  // Trigger contract renewal alerts manually
  triggerRenewalAlerts: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger monitoring jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const result = await contractRenewalAlerts();
      return result;
    }),
  
  // Run all monitoring jobs at once
  triggerAllJobs: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger monitoring jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const results = await runAllMonitoringJobs();
      return results;
    }),
  
  // Get monitoring job status (placeholder for future implementation)
  getJobStatus: protectedProcedure
    .query(async ({ ctx }) => {
      // Only admins can view job status
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      // TODO: Implement job status tracking
      return {
        lastCovenantCheck: null,
        lastSupplyRecalc: null,
        lastRenewalCheck: null,
        scheduledJobs: [
          {
            name: 'Daily Covenant Check',
            schedule: 'Every day at 6:00 AM',
            lastRun: null,
            nextRun: null,
            status: 'pending_setup',
          },
          {
            name: 'Weekly Supply Recalculation',
            schedule: 'Every Monday at 2:00 AM',
            lastRun: null,
            nextRun: null,
            status: 'pending_setup',
          },
          {
            name: 'Contract Renewal Alerts',
            schedule: 'Every day at 7:00 AM',
            lastRun: null,
            nextRun: null,
            status: 'pending_setup',
          },
        ],
      };
    }),
});
