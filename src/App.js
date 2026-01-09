import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import GlacierMap from "./pages/glaciermap";
import About from "./pages/About";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";


const useDocumentTitle = (title) => {
  React.useEffect(() => {
    document.title = title;
  }, [title]);
};

const GlacierMapPage = () => {
  useDocumentTitle("Oregon Glaciers Institute");
  return <GlacierMap />;
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
            <Route path="/" element={<GlacierMapPage />} />
            <Route path="/glaciers" element={<GlacierMapPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<GlacierMapPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
