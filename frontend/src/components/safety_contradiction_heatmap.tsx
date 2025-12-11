// src/components/SafetyContradictionHeatmap.jsx
const SafetyContradictionHeatmap = ({ heatmap }) => {
  if (!heatmap || heatmap.length === 0) {
    return <p className="text-gray-500 italic">No specific adverse events detailed in the heatmap for visualization.</p>;
  }

  // Define colors based on Contradiction Level for the main card border
  const getContradictionBorderColor = (level) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'border-red-600 shadow-red-200';
      case 'high': return 'border-orange-500 shadow-orange-200';
      case 'medium': return 'border-yellow-500 shadow-yellow-200';
      case 'low': return 'border-green-500 shadow-green-200';
      default: return 'border-gray-400 shadow-gray-200';
    }
  };

  // Define colors based on Severity Score for the inner heatmap block
  const getSeverityBackgroundColor = (score) => {
    if (score >= 5) return 'bg-red-700';
    if (score >= 4) return 'bg-red-500';
    if (score >= 3) return 'bg-orange-500';
    if (score >= 2) return 'bg-yellow-500';
    return 'bg-green-500'; // Score 1 or less
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {heatmap.map((item, index) => (
        <div 
          key={index} 
          className={`p-4 rounded-lg border-2 ${getContradictionBorderColor(item.contradiction_level)} shadow-md transition duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-white`}
        >
          <div className="flex items-start justify-between">
            {/* Adverse Event Title */}
            <h4 className="text-base font-semibold text-gray-900 mb-2 leading-tight">
              {item.adverse_event}
            </h4>
            
            {/* Severity Heat Block */}
            <div className={`w-10 h-10 flex items-center justify-center rounded-md flex-shrink-0 ${getSeverityBackgroundColor(item.post_market_severity_score)} text-white font-extrabold text-lg ml-3`}>
              {item.post_market_severity_score}
            </div>
          </div>

          <div className="mt-2 space-y-1 text-sm">
            {/* Trial Frequency */}
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">Trial Freq:</span>
              <span className="font-bold text-indigo-700">{item.trial_frequency_percent.toFixed(2)}%</span>
            </p>

            {/* Contradiction Level Label */}
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">Signal Status:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${item.contradiction_level === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                {item.contradiction_level}
              </span>
            </p>

            {/* Severity Explanation */}
            <p className="text-xs text-gray-500 pt-1 border-t mt-2">
              <span className="font-bold">Severity Score:</span> 1=Minor, 5=Life-Threatening
            </p>
          </div>
        </div>
      ))}
      {/* Legend for context */}
      <div className="md:col-span-2 lg:col-span-3 p-3 bg-gray-100 rounded-lg text-sm text-gray-700 mt-4">
        <h5 className="font-bold mb-1">Heatmap Legend:</h5>
        <p>• **Card Border Color:** Represents the **Contradiction Level** (Red=Critical, Orange=High, Yellow=Medium).</p>
        <p>• **Inner Block Color/Score:** Represents the **Post-Market Severity Score** (Dark Red=5, Light Green=1).</p>
      </div>
    </div>
  );
};

export default SafetyContradictionHeatmap;