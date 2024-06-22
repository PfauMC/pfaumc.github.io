import React from 'react'
import "./Profile.scss"
import Auth from "../Components/Auth";
import SocialIcons from "../Components/SocialIcons"

export default function Profile() {
    return (
        <div>
            <div className="profile">
                <Auth/>
                <SocialIcons/>


            </div>

        </div>
    )
}