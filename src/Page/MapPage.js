import React from "react";
import './MapPage.scss';
import SocialIcons from "../Components/SocialIcons";
import BlackBar from '../Components/BlackBar';

export default function MapPage() {
    return (
        <div className="MapPage">
            <div className="map">
                <BlackBar/>
                <iframe src="https://map.pfaumc.io/" width="100%" height="100%">
                </iframe>

                <SocialIcons/>
            </div>
            <BlackBar/>
        </div>




    )
}
