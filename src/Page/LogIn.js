import React from 'react'
import "./Login.scss"
import Auth from "../Components/Auth";
import SocialIcons from "../Components/SocialIcons"
import Fireflies from '../Components/Fireflies';

export default function Profile() {
    return (
        <div>
            <div className="login">
                <Auth/>
                <SocialIcons/>

                <Fireflies/>


            </div>

        </div>
    )
}