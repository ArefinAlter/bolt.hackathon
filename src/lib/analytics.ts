import { supabase } from './supabase';
import { AnalyticsResponse, MetricType, DateRangeFilter } from '@/types/analytics';

export async function fetchAnalytics(
  businessId: string,
  metricType: MetricType = 'all',
  dateRange?: DateRangeFilter
): Promise<AnalyticsResponse> {
  try {
    // Build the URL with query parameters
    let url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-analytics?business_id=${businessId}`;
    
    if (metricType !== 'all') {
      url += `&metric_type=${metricType}`;
    }
    
    if (dateRange) {
      if (dateRange.range === 'custom' && dateRange.startDate && dateRange.endDate) {
        url += `&start_date=${dateRange.startDate.toISOString()}&end_date=${dateRange.endDate.toISOString()}`;
      } else {
        url += `&time_range=${dateRange.range}`;
      }
    }
    
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    // Make the API call
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the API response to match expected AnalyticsResponse format
    return {
      success: data.success,
      business_id: data.business_id,
      analytics: data.analytics || {}
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

export function generatePDF(data: any, fileName: string = 'analytics-report.pdf'): void {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Dokani Analytics Report', 14, 22);
      
      // Add date
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Add return metrics
      if (data.returns) {
        doc.setFontSize(14);
        doc.text('Return Metrics', 14, 40);
        
        autoTable(doc, {
          startY: 45,
          head: [['Metric', 'Value']],
          body: [
            ['Total Returns', data.returns.total_returns.toString()],
            ['Approved Returns', data.returns.approved_returns.toString()],
            ['Denied Returns', data.returns.denied_returns.toString()],
            ['Auto-Approval Rate', data.returns.auto_approval_rate + '%'],
            ['Approval Rate', data.returns.approval_rate + '%'],
          ],
        });
      }
      
      // Add AI accuracy metrics
      if (data.ai_accuracy) {
        const finalY = (doc as any).lastAutoTable.finalY || 45;
        doc.setFontSize(14);
        doc.text('AI Accuracy Metrics', 14, finalY + 10);
        
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Metric', 'Value']],
          body: [
            ['Total AI Decisions', data.ai_accuracy.total_ai_decisions.toString()],
            ['Correct Decisions', data.ai_accuracy.correct_decisions.toString()],
            ['Accuracy Rate', data.ai_accuracy.accuracy_rate + '%'],
            ['Average Confidence', data.ai_accuracy.average_confidence],
          ],
        });
      }
      
      // Add satisfaction metrics
      if (data.satisfaction) {
        const finalY = (doc as any).lastAutoTable.finalY || 45;
        doc.setFontSize(14);
        doc.text('Customer Satisfaction Metrics', 14, finalY + 10);
        
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Metric', 'Value']],
          body: [
            ['Total Interactions', data.satisfaction.total_interactions.toString()],
            ['Positive Interactions', data.satisfaction.positive_interactions.toString()],
            ['Negative Interactions', data.satisfaction.negative_interactions.toString()],
            ['Satisfaction Score', data.satisfaction.satisfaction_score + '%'],
            ['Average Response Time', data.satisfaction.response_time_avg],
          ],
        });
      }
      
      // Add policy metrics
      if (data.policy) {
        const finalY = (doc as any).lastAutoTable.finalY || 45;
        doc.setFontSize(14);
        doc.text('Policy Metrics', 14, finalY + 10);
        
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Metric', 'Value']],
          body: [
            ['Total Policies', data.policy.total_policies.toString()],
            ['Active Policy', data.policy.active_policy],
            ['Policy Changes', data.policy.policy_changes.toString()],
            ['Current Approval Rate', data.policy.current_approval_rate + '%'],
            ['Policy Effectiveness', data.policy.policy_effectiveness],
          ],
        });
      }
      
      // Save the PDF
      doc.save(fileName);
    });
  });
}