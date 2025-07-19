import { useState } from 'react';
import { FaHeart, FaChartLine, FaAppleAlt, FaBalanceScale, FaRunning, FaBrain, FaLeaf, FaCalendarAlt, FaUtensils, FaClipboardList } from 'react-icons/fa';
import { FaPlay } from 'react-icons/fa';

const ProjectThumbnailHealth = () => {
  const [showVideo, setShowVideo] = useState(false);
  const features = [
    { icon: FaHeart, title: "Health Tracking", description: "Comprehensive health metrics and progress monitoring" },
    { icon: FaChartLine, title: "Nutrition Analytics", description: "Detailed nutrition tracking and analysis" },
    { icon: FaAppleAlt, title: "Dietary Goals", description: "Personalized nutrition goals and recommendations" },
    { icon: FaBalanceScale, title: "Portion Control", description: "Smart portion suggestions and tracking" },
    { icon: FaRunning, title: "Activity Integration", description: "Connect with your fitness routine" },
    { icon: FaBrain, title: "Mood & Health", description: "Track how food affects your mood and well-being" },
    { icon: FaLeaf, title: "Sustainable Eating", description: "Eco-friendly food choices and impact tracking" },
    { icon: FaCalendarAlt, title: "Meal Planning", description: "Smart meal planning with nutrition balance" },
    { icon: FaUtensils, title: "Recipe Health Score", description: "Nutritional analysis of recipes" },
    { icon: FaClipboardList, title: "Health Reports", description: "Weekly and monthly health insights" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NutriVerseAI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your Personal Health & Nutrition Companion
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
            Comprehensive Health & Nutrition Tracking
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Coming Soon to Production
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectThumbnailHealth; 