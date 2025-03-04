import React, { useState } from 'react';

const testData = {
  storeInfo: {
    id: 1,
    name: "Whole Foods Market",
    location: { lat: 40.7128, lng: -74.0060 },
    businessHours: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '10:00', close: '20:00' },
      sunday: { open: '10:00', close: '20:00' }
    },
    currentCrowdLevel: 'medium',
    storeLayout: {
      sections: [
        { name: 'Produce', location: 'front' },
        { name: 'Dairy', location: 'back' },
        { name: 'Meat', location: 'right' },
        { name: 'Bakery', location: 'left' }
      ]
    }
  },
  shoppingList: {
    name: "Weekly Groceries",
    items: [
      { name: 'Organic Bananas', quantity: 2, unit: 'lb', price: 2.99 },
      { name: 'Almond Milk', quantity: 1, unit: 'gallon', price: 4.99 },
      { name: 'Greek Yogurt', quantity: 2, unit: 'pack', price: 5.99 },
      { name: 'Chicken Breast', quantity: 3, unit: 'lb', price: 12.99 }
    ],
    aiOptimizations: {
      route: {
        path: ['Produce', 'Dairy', 'Meat'],
        estimatedTime: '20 minutes',
        steps: [
          'Start at Produce section for fresh items',
          'Head to Dairy for cold items',
          'Finish at Meat section'
        ]
      },
      alternativeItems: [
        {
          original: 'Organic Bananas',
          alternatives: [
            { name: 'Regular Bananas', price: 1.99, savings: 1.00 },
            { name: 'Organic Plantains', price: 2.49, savings: 0.50 }
          ]
        },
        {
          original: 'Almond Milk',
          alternatives: [
            { name: 'Soy Milk', price: 3.99, savings: 1.00 },
            { name: 'Oat Milk', price: 4.49, savings: 0.50 }
          ]
        }
      ],
      savings: {
        originalTotal: 45.99,
        optimizedTotal: 39.99,
        totalSavings: 6.00,
        recommendations: [
          'Switch to regular bananas to save $1.00',
          'Buy Greek Yogurt in bulk to save $2.00',
          'Choose store brand almond milk to save $1.50'
        ]
      }
    },
    sustainabilityScore: 85,
    nutritionAlignment: {
      score: 90,
      analysis: "Good balance of protein, fruits, and dairy",
      suggestions: [
        "Consider adding leafy greens",
        "Good protein choices"
      ]
    }
  },
  insights: {
    spendingPatterns: {
      weeklyAverage: 150,
      topCategories: ['Produce', 'Dairy', 'Meat'],
      trendsChart: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: [145, 152, 148, 155]
      }
    },
    priceAlerts: [
      {
        item: "Organic Bananas",
        message: "Price expected to increase next week",
        recommendation: "Buy now to save"
      },
      {
        item: "Greek Yogurt",
        message: "Bulk discount available",
        recommendation: "Buy 3 packs to save 20%"
      }
    ],
    bestShoppingTimes: [
      { day: 'Wednesday', time: '10:00 AM', crowdLevel: 'Low' },
      { day: 'Saturday', time: '9:00 AM', crowdLevel: 'Medium' }
    ]
  }
};

export const SmartShoppingDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'insights' | 'route'>('list');
  const [showAlternatives, setShowAlternatives] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Smart Shopping Assistant</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          className={\`px-4 py-2 rounded-lg \${activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}\`}
          onClick={() => setActiveTab('list')}
        >
          Shopping List
        </button>
        <button
          className={\`px-4 py-2 rounded-lg \${activeTab === 'insights' ? 'bg-blue-500 text-white' : 'bg-gray-200'}\`}
          onClick={() => setActiveTab('insights')}
        >
          AI Insights
        </button>
        <button
          className={\`px-4 py-2 rounded-lg \${activeTab === 'route' ? 'bg-blue-500 text-white' : 'bg-gray-200'}\`}
          onClick={() => setActiveTab('route')}
        >
          Smart Route
        </button>
      </div>

      {/* Shopping List Tab */}
      {activeTab === 'list' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{testData.shoppingList.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm">Sustainability Score:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                {testData.shoppingList.sustainabilityScore}/100
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {testData.shoppingList.items.map((item, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.quantity} {item.unit} - ${item.price}
                    </p>
                  </div>
                  <button
                    className="text-blue-500 text-sm"
                    onClick={() => setShowAlternatives(!showAlternatives)}
                  >
                    View Alternatives
                  </button>
                </div>

                {showAlternatives && testData.shoppingList.aiOptimizations.alternativeItems.find(
                  alt => alt.original === item.name
                ) && (
                  <div className="mt-2 pl-4 border-l-2 border-blue-200">
                    <p className="text-sm text-gray-600 mb-2">Alternative Options:</p>
                    {testData.shoppingList.aiOptimizations.alternativeItems
                      .find(alt => alt.original === item.name)
                      ?.alternatives.map((alt, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span>{alt.name}</span>
                          <span className="text-green-600">Save ${alt.savings}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Potential Savings</h3>
            <div className="space-y-2">
              <p className="text-sm">Original Total: ${testData.shoppingList.aiOptimizations.savings.originalTotal}</p>
              <p className="text-sm">Optimized Total: ${testData.shoppingList.aiOptimizations.savings.optimizedTotal}</p>
              <p className="text-sm text-green-600">Total Savings: ${testData.shoppingList.aiOptimizations.savings.totalSavings}</p>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Shopping Patterns</h2>
            <p className="mb-2">Weekly Average Spend: ${testData.insights.spendingPatterns.weeklyAverage}</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Top Categories:</p>
              <div className="flex gap-2">
                {testData.insights.spendingPatterns.topCategories.map((category, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Price Alerts</h2>
            <div className="space-y-4">
              {testData.insights.priceAlerts.map((alert, index) => (
                <div key={index} className="border-l-4 border-yellow-400 pl-4">
                  <p className="font-medium">{alert.item}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  <p className="text-sm text-blue-600">{alert.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Best Shopping Times</h2>
            <div className="space-y-2">
              {testData.insights.bestShoppingTimes.map((time, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{time.day}</p>
                    <p className="text-sm text-gray-600">{time.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    time.crowdLevel === 'Low' ? 'bg-green-100 text-green-800' :
                    time.crowdLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {time.crowdLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Smart Route Tab */}
      {activeTab === 'route' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Optimized Shopping Route</h2>
            <p className="text-sm text-gray-600 mb-4">
              Estimated Time: {testData.shoppingList.aiOptimizations.route.estimatedTime}
            </p>
            
            <div className="space-y-4">
              {testData.shoppingList.aiOptimizations.route.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    {index + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Store Layout</h2>
            <div className="grid grid-cols-2 gap-4">
              {testData.storeInfo.storeLayout.sections.map((section, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{section.name}</p>
                  <p className="text-sm text-gray-600">Location: {section.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartShoppingDemo;