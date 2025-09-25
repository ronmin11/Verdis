import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  MapPin,
  Clock,
  TrendingUp
} from 'lucide-react';
import { HealthAssessment } from '../../types';
import { cn } from '../../utils/cn';

interface HealthListProps {
  assessments: HealthAssessment[];
  onAssessmentSelect: (assessment: HealthAssessment) => void;
  selectedAssessment?: HealthAssessment;
  expandedItems: Set<string>;
  onToggleExpanded: (id: string) => void;
  className?: string;
}

const HealthList: React.FC<HealthListProps> = ({
  assessments,
  onAssessmentSelect,
  selectedAssessment,
  expandedItems,
  onToggleExpanded,
  className = ''
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-primary-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-secondary-600" />;
      case 'unhealthy':
        return <AlertTriangle className="w-5 h-5 text-danger-600" />;
      default:
        return <MapPin className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'unhealthy':
        return 'badge-danger';
      default:
        return 'badge bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'text-danger-700';
      case 'medium':
        return 'text-secondary-700';
      case 'low':
        return 'text-primary-700';
      default:
        return 'text-gray-700';
    }
  };

  // Sort assessments by health status (unhealthy first, then warning, then healthy)
  const sortedAssessments = [...assessments].sort((a, b) => {
    const statusOrder = { unhealthy: 0, warning: 1, healthy: 2 };
    return statusOrder[a.healthStatus] - statusOrder[b.healthStatus];
  });

  return (
    <div className={`card ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Health Assessments</h3>
        <p className="text-sm text-gray-600 mt-1">
          {assessments.length} locations assessed
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        <div className="divide-y divide-gray-100">
          {sortedAssessments.map((assessment) => {
            const isExpanded = expandedItems.has(assessment.id);
            const isSelected = selectedAssessment?.id === assessment.id;
            const hasIssue = assessment.predictedIssue;

            return (
              <div key={assessment.id} className="p-4">
                <div
                  className={cn(
                    'flex items-center justify-between cursor-pointer transition-colors rounded-lg p-2 -m-2',
                    isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                  )}
                  onClick={() => onAssessmentSelect(assessment)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(assessment.healthStatus)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {assessment.location.identifier}
                        </h4>
                        <span className={cn('badge', getStatusBadge(assessment.healthStatus))}>
                          {assessment.healthStatus}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{assessment.confidence}% confidence</span>
                        </div>
                        {assessment.ndviValue && (
                          <div>
                            NDVI: {assessment.ndviValue.toFixed(2)}
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(assessment.lastAssessed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {hasIssue && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpanded(assessment.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && hasIssue && (
                  <div className="mt-3 ml-8 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <h5 className={cn('text-sm font-medium', getSeverityColor(assessment.predictedIssue?.severity))}>
                          Predicted Issue: {assessment.predictedIssue.disease}
                          {assessment.predictedIssue.pest && ` & ${assessment.predictedIssue.pest}`}
                        </h5>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                          <span>Confidence: {assessment.predictedIssue.confidence}%</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            assessment.predictedIssue.severity === 'high' ? 'bg-danger-100 text-danger-800' :
                            assessment.predictedIssue.severity === 'medium' ? 'bg-secondary-100 text-secondary-800' :
                            'bg-primary-100 text-primary-800'
                          )}>
                            {assessment.predictedIssue.severity} severity
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h6 className="text-xs font-medium text-gray-700 mb-1">Recommended Action:</h6>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {assessment.predictedIssue.recommendedAction}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-primary-600">
              {assessments.filter(a => a.healthStatus === 'healthy').length}
            </div>
            <div className="text-xs text-gray-600">Healthy</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-secondary-600">
              {assessments.filter(a => a.healthStatus === 'warning').length}
            </div>
            <div className="text-xs text-gray-600">Warning</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-danger-600">
              {assessments.filter(a => a.healthStatus === 'unhealthy').length}
            </div>
            <div className="text-xs text-gray-600">Unhealthy</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthList;