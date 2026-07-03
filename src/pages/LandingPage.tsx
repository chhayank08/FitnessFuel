import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Utensils, BarChart, Menu, X, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Testimonial = {
  id: number;
  name: string;
  role: string;
  content: string;
  image: string;
};

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { user, signOut, signIn, signUp, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'signIn') {
      await signIn(email, password);
    } else {
      await signUp(email, password, fullName);
    }
  };

  const features = [
    {
      title: 'Personalized Diet Plans Just for You',
      description: 'Receive customized meal plans that suit your lifestyle.',
      icon: <Utensils className="h-10 w-10 text-primary-500" />,
      image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80'
    },
    {
      title: 'Tailored Exercise Routines for Every Fitness Level',
      description: 'Engage in workouts designed specifically for your needs.',
      icon: <Dumbbell className="h-10 w-10 text-primary-500" />,
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80'
    },
    {
      title: 'Track Your Progress and Stay Motivated',
      description: 'Monitor your achievements and celebrate your milestones.',
      icon: <BarChart className="h-10 w-10 text-primary-500" />,
      image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80'
    }
  ];

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Lost 30 lbs in 6 months',
      content: 'Fitness Fuel completely transformed my approach to health. The personalized meal plans and workout routines made it easy to stay consistent and see real results.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1287&q=80'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Gained 15 lbs of muscle',
      content: 'As someone who struggled to gain weight, the nutrition guidance from Fitness Fuel was a game-changer. The app helped me track my progress and stay motivated.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1287&q=80'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Marathon runner',
      content: 'The training plans in Fitness Fuel helped me prepare for my first marathon. The nutrition tips and recovery strategies were essential to my success.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80'
    }
  ];

  const openAuthModal = (mode: 'signIn' | 'signUp') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark-500 text-white">
      <nav className="bg-dark-500 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Dumbbell className="h-8 w-8 text-primary-500" />
                <span className="ml-2 text-xl font-bold">Fitness Fuel</span>
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-dark-400">
                Home
              </Link>
              <Link to="/features" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-dark-400">
                Features
              </Link>
              <Link to="/pricing" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-dark-400">
                Pricing
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-2 rounded-md text-sm font-medium bg-primary-500 hover:bg-primary-600 transition duration-150"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => signOut()}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-dark-400"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => openAuthModal('signIn')}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-dark-400"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => openAuthModal('signUp')}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-primary-500 hover:bg-primary-600 transition duration-150"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-400 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark-500 pb-3 px-2 pt-2">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-dark-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/features" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-dark-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-dark-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-3 py-2 rounded-md text-base font-medium bg-primary-500 hover:bg-primary-600 mt-1 transition duration-150"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-dark-400 mt-1"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => {
                    openAuthModal('signIn');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-dark-400 mt-1"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => {
                    openAuthModal('signUp');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary-500 hover:bg-primary-600 mt-1 transition duration-150"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        )}
      </nav>
      <main>
        {/* Hero Section */}
        <section className="bg-dark-500 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Unlock Your Health and Fitness Potential
                </h1>
                <p className="mt-6 text-lg text-gray-300">
                  Fitness Fuel offers personalized diet and exercise plans tailored to your unique needs. 
                  Experience the convenience of meal planning and track your progress towards your fitness goals.
                </p>
                
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-xl">Health Improvement</h3>
                    <p className="mt-2 text-gray-400">
                      Boost your overall health with customized nutrition and fitness recommendations.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">Meal Planning</h3>
                    <p className="mt-2 text-gray-400">
                      Easily plan your meals with our intuitive and user-friendly interface.
                    </p>
                  </div>
                </div>
                
                <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button 
                    onClick={() => openAuthModal('signUp')}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-md transition duration-200"
                  >
                    Join Now
                  </button>
                  <button className="group flex items-center justify-center text-primary-400 hover:text-primary-300 font-medium py-3 px-6 rounded-md border border-primary-400 hover:border-primary-300 transition duration-200">
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <img 
                  src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                  alt="Fitness tracking and meal planning" 
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-dark-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Discover Your Personalized Fitness Journey
              </h2>
              <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
                Fitness Fuel offers tailored solutions for your health goals. Experience a unique approach to fitness with our app.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-dark-500 rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-8 rounded-md transition duration-200">
                Learn More
              </button>
              <button 
                onClick={() => openAuthModal('signUp')}
                className="ml-4 text-primary-400 hover:text-primary-300 font-medium py-3 px-8 rounded-md border border-primary-400 hover:border-primary-300 transition duration-200"
              >
                Sign Up
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-dark-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Success Stories from Our Community
              </h2>
              <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
                Hear from people who have transformed their lives with Fitness Fuel.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-dark-400 rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="ml-4">
                      <h4 className="text-white font-medium">{testimonial.name}</h4>
                      <p className="text-primary-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300">"{testimonial.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-gradient-to-r from-dark-500 via-dark-400 to-primary-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Transform Your Fitness Journey with Personalization
              </h2>
              <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
                At Fitness Fuel, we believe that one size does not fit all. Our app tailors diet and exercise plans to your unique needs, helping you achieve your fitness goals effectively.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={() => openAuthModal('signUp')}
                  className="bg-white hover:bg-gray-100 text-dark-500 font-medium py-3 px-8 rounded-md transition duration-200"
                >
                  Get Started
                </button>
                <button className="bg-transparent hover:bg-primary-600 text-white font-medium py-3 px-8 rounded-md border border-white hover:border-primary-600 transition duration-200">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-dark-500 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and description */}
            <div className="col-span-1">
              <Link to="/" className="flex items-center">
                <Dumbbell className="h-8 w-8 text-primary-500" />
                <span className="ml-2 text-xl font-bold text-white">Fitness Fuel</span>
              </Link>
              <p className="mt-4 text-sm">
                Personalized fitness solutions to help you achieve your health and wellness goals.
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="col-span-1">
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-sm hover:text-primary-400 transition duration-150">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm hover:text-primary-400 transition duration-150">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-sm hover:text-primary-400 transition duration-150">
                    Blog Posts
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-sm hover:text-primary-400 transition duration-150">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="text-sm hover:text-primary-400 transition duration-150">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Resources */}
            <div className="col-span-1">
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/nutrition" className="text-sm hover:text-primary-400 transition duration-150">
                    Nutrition Tips
                  </Link>
                </li>
                <li>
                  <Link to="/workouts" className="text-sm hover:text-primary-400 transition duration-150">
                    Workout Guides
                  </Link>
                </li>
                <li>
                  <Link to="/success-stories" className="text-sm hover:text-primary-400 transition duration-150">
                    Success Stories
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="text-sm hover:text-primary-400 transition duration-150">
                    Community
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="text-sm hover:text-primary-400 transition duration-150">
                    Events
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Newsletter */}
            <div className="col-span-1">
              <h3 className="text-white font-semibold mb-4">Subscribe</h3>
              <p className="text-sm mb-4">
                Join our newsletter to stay updated on features and releases.
              </p>
              <form className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-2 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Subscribe
                </button>
              </form>
              
              <div className="mt-6 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary-400 transition duration-150">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition duration-150">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition duration-150">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition duration-150">
                  <Linkedin size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition duration-150">
                  <Youtube size={20} />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-dark-400 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} Fitness Fuel. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {authModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-500 rounded-lg shadow-xl w-full max-w-md relative overflow-hidden">
            <div className="p-6">
              <button 
                onClick={() => setAuthModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">
                {authMode === 'signIn' ? 'Sign In' : 'Create Account'}
              </h2>
              
              {error && (
                <div className="mb-4 p-3 bg-secondary-500 bg-opacity-20 border border-secondary-500 rounded text-secondary-500">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {authMode === 'signUp' && (
                  <div className="mb-4">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-md transition duration-200 disabled:opacity-70"
                >
                  {loading ? 'Processing...' : authMode === 'signIn' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              
              <div className="mt-4 text-center text-gray-400">
                {authMode === 'signIn' ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setAuthMode(authMode === 'signIn' ? 'signUp' : 'signIn')}
                  className="ml-1 text-primary-400 hover:text-primary-300 font-medium"
                >
                  {authMode === 'signIn' ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;