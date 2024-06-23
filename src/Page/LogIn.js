import React from 'react'
import "./Profile.scss"
import Auth from "../Components/Auth";
import SocialIcons from "../Components/SocialIcons"
import Fireflies from '../Components/Fireflies';

export default function Profile() {
    return (
        <div>
            <div className="profile">
                <Auth/>
                <SocialIcons/>

                <Fireflies/>


            </div>

        </div>
    )
}