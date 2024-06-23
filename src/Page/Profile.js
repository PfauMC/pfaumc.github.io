import React from 'react'
import "./Profile.scss"
import Pro from "../Components/Profile"
import SocialIcons from "../Components/SocialIcons"
import Fireflies from '../Components/Fireflies';

export default function Profile() {
    return (
        <div>
            <div className="profile">
                <Pro/>
                <SocialIcons/>
                <Fireflies/>

            </div>
            {/*Я чуток устала как-то(*/}
        </div>
    )
}