import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RestaurantAppWithAuth from "./RestaurantApp";
import DeliveryAppWithAuth from "./DeliveryApp";

// App Router Component
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RestaurantAppWithAuth />} />
        <Route path="/restaurant" element={<RestaurantAppWithAuth />} />
        <Route path="/delivery" element={<DeliveryAppWithAuth />} />
      </Routes>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
