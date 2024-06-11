import React from 'react';
import {Route, Routes} from 'react-router-dom';
import NavigationBar from './Components/NavigationBar';
import MainContent from './Page/MainContent';
import RulesPage from './Page/RulesPage';
import GuildPage from './Page/GuildPage';
import LogIn from './Page/LogIn';
import Footer from "./Components/Footer";
import Profile from './Page/Profile';

const App = () => {
    return (
        <>
            <NavigationBar/>
            <Routes>
                <Route exact path="/" element={<MainContent/>}/>
                <Route path="/rules" element={<RulesPage/>}/>
                <Route path="/guild" element={<GuildPage/>}/>
                <Route path="/login" element={<LogIn/>}/>
                <Route path="/profile" element={<Profile/>}/>

            </Routes>

            <Footer/>
        </>


    );
};


export default App;
