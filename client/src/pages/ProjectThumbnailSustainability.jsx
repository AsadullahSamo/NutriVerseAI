import React, { useState } from 'react';
import { FaLeaf, FaRecycle, FaUtensils, FaChartBar, FaListAlt, FaClock, FaLightbulb, FaTools, FaShoppingCart, FaChartPie } from 'react-icons/fa';
import { FaPlay } from 'react-icons/fa';

const ProjectThumbnailSustainability = () => {
  const [showVideo, setShowVideo] = useState(false);
  const features = [
    { icon: FaLeaf, title: "Sustainability Focus", description: "Reduce food waste & track environmental impact" },
    { icon: FaRecycle, title: "Waste Reduction", description: "Smart tracking of food expiry and waste prevention" },
    { icon: FaUtensils, title: "Smart Kitchen", description: "Equipment management & maintenance, recipe matches and recommendations" },
    { icon: FaChartBar, title: "Impact Analytics", description: "Track your environmental footprint and savings" },
    { icon: FaListAlt, title: "Grocery Management", description: "Smart lists, pantry management and analysis" },
    { icon: FaClock, title: "Expiry Tracking", description: "Smart alerts for expiring ingredients" },
    { icon: FaLightbulb, title: "Energy Efficiency", description: "Tips for energy-efficient cooking" },
    { icon: FaTools, title: "Equipment Care", description: "Maintenance schedules and care tips" },
    { icon: FaShoppingCart, title: "Smart Shopping", description: "Eco-friendly shopping suggestions" },
    { icon: FaChartPie, title: "Resource Usage", description: "Track and optimize resource consumption" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NutriVerseAI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Smart Kitchen for Sustainable Living
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <a
              href="https://github.com/AsadullahSamo/NutriVerseAI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Explore Project
            </a>
            <button
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center px-4 py-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <FaPlay className="mr-2" />
              Watch Demo
            </button>
          </div>
        </div>

        {showVideo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <button
                onClick={() => setShowVideo(false)}
                className="absolute -top-8 right-0 text-white hover:text-accent transition-colors"
              >
                Close
              </button>
              <div className="aspect-video w-full">
                <iframe
                  src="https://www.youtube.com/embed/0L-h_AwWGW4"
                  title="NutriVerseAI Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg bg-card hover:bg-card/90 transition-colors border border-border"
            >
              <feature.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Sustainable Kitchen Management and Waste Reduction
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Coming Soon to Production
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectThumbnailSustainability; 