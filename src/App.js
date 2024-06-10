import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import NavigationBar from './Components/NavigationBar';
import MainContent from './Page/MainContent';
import RulesPage from './Page/RulesPage';
import GuildPage from './Page/GuildPage';
import LogIn from './Page/LogIn';
import Footer from "./Components/Footer";

const App = () => {
    return (
        <>
            <Router>
                <NavigationBar/>
                <Routes>
                    <Route exact path="/" element={<MainContent/>}/>
                    <Route path="/Page/RulesPage" element={<RulesPage/>}/>
                    <Route path="/Page/GuildPage" element={<GuildPage/>}/>
                    <Route path="/Page/LogIn" element={<LogIn/>}/>
                </Routes>
            </Router>

            <Footer/>
        </>


    );
};


export default App;
