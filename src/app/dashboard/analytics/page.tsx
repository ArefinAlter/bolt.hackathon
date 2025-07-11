'use client';

import { Grid, GridItem, Flex, Container } from '@/components/ui/grid';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <div>
      <Grid cols={12} gap="lg">
        <GridItem span={12}>
          <AnalyticsDashboard />
        </GridItem>
      </Grid>
    </div>
  );
}