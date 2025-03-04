import React from 'react';
import SmartShoppingDemo from '../components/SmartShoppingDemo';

export const ShoppingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <SmartShoppingDemo />
      </div>
    </div>
  );
};

export default ShoppingPage;