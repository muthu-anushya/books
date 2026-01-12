import { useState } from "react";
import ListAvailableBooks from "./component/ListAvailableBooks";
import BookAvailableSeniorList from "./component/BookAvailableSeniorList";
import Dashboard from "./component/Dashboard";
import AddotherBooks from "./component/AddotherBooks";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SeniorSite from "./sites.js/SeniorSite";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/listavailablebooks" element={<ListAvailableBooks />} />
        <Route path="/bookavailable" element={<BookAvailableSeniorList />} />
        <Route path="/addotherbooks" element={<AddotherBooks />} />
        <Route path="/seniorsite" element={<SeniorSite />} />
      </Routes>
    </Router>
  );
}

export default App;
