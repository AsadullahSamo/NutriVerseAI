import React, { useState } from 'react';
import { FaRobot, FaUtensils, FaBrain, FaGlobeAmericas, FaLeaf, FaHeart } from 'react-icons/fa';
import { FaPlay } from 'react-icons/fa';

const ProjectThumbnailYouTube = () => {
  const [showVideo, setShowVideo] = useState(false);
  const features = [
    { icon: FaRobot, title: "AI-Powered", description: "12 AI services enhancing your cooking experience" },
    { icon: FaUtensils, title: "Smart Kitchen", description: "Intelligent equipment management & maintenance" },
    { icon: FaBrain, title: "Personalized", description: "Customized meal planning & nutrition insights" },
    { icon: FaGlobeAmericas, title: "Cultural", description: "Authentic recipes & cultural traditions" },
    { icon: FaLeaf, title: "Sustainable", description: "Waste reduction & environmental impact tracking" },
    { icon: FaHeart, title: "Health Focus", description: "Comprehensive health & nutrition tracking" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            NutriVerseAI
          </h1>
          <p className="text-2xl text-muted-foreground mb-8 font-semibold">
            The Future of Smart Cooking
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <a
              href="https://github.com/AsadullahSamo/NutriVerseAI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Explore Project
            </a>
            <button
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <FaPlay className="mr-2" />
              Watch Demo
            </button>
          </div>
        </div>

        {showVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <button
                onClick={() => setShowVideo(false)}
                className="absolute -top-8 right-0 text-white hover:text-accent transition-colors text-lg"
              >
                Close
              </button>
              <div className="aspect-video w-full">
                <iframe
                  src="https://www.youtube.com/embed/0L-h_AwWGW4"
                  title="NutriVerseAI Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-xl bg-card/50 hover:bg-card/80 transition-colors border border-border/50 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-lg">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-2xl text-muted-foreground font-semibold">
            Revolutionizing the Way We Cook
          </p>
          <p className="text-lg text-muted-foreground mt-4">
            Coming Soon to Production
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectThumbnailYouTube; 