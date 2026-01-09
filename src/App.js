import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import WeatherMap from "./pages/weatherMap";
import About from "./pages/About";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";


const useDocumentTitle = (title) => {
  React.useEffect(() => {
    document.title = title;
  }, [title]);
};

const WeatherMapPage = () => {
  useDocumentTitle("Oregon Glaciers Institute");
  return <WeatherMap />;
};

const AboutPage = () => {
  useDocumentTitle("About");
  return <About />;
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<WeatherMapPage />} />
            <Route path="/glaciers" element={<WeatherMapPage />} />
            <Route path="/glaciers" element={<WeatherMapPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<WeatherMapPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
