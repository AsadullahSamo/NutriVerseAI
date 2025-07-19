import { useState } from 'react';
import { FaRobot, FaBrain, FaCog, FaMagic, FaCode, FaServer, FaDatabase, FaShieldAlt, FaMobileAlt, FaCloud } from 'react-icons/fa';
import { FaPlay } from 'react-icons/fa';

const ProjectThumbnailAI = () => {
  const [showVideo, setShowVideo] = useState(false);
  const features = [
    { icon: FaRobot, title: "AI-Powered Planning", description: "Smart meal planning & personalized nutrition insights and recommendations" },
    { icon: FaBrain, title: "Mood Analysis", description: "AI-powered mood tracking and pattern analysis for cooking experiences" },
    { icon: FaCog, title: "Smart Alerts", description: "Intelligent expiry tracking and recipe suggestions" },
    { icon: FaMagic, title: "AI Integration", description: "12 AI services enhancing features" },
    { icon: FaCode, title: "Modern Tech Stack", description: "React, TypeScript, Node.js, PostgreSQL" },
    { icon: FaServer, title: "Robust Backend", description: "Express.js with secure authentication" },
    { icon: FaDatabase, title: "Data Management", description: "Efficient data handling with Drizzle ORM" },
    { icon: FaShieldAlt, title: "Security", description: "Advanced authentication with secret key implementation" },
    { icon: FaMobileAlt, title: "Responsive Design", description: "Seamless experience across all devices" },
    { icon: FaCloud, title: "Cloud Ready", description: "Optimized for cloud deployment" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NutriVerseAI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Powered by Advanced AI & Modern Technology
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
            Built with Modern Technologies and AI Integration
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Coming Soon to Production
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectThumbnailAI; 