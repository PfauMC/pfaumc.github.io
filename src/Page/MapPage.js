import React from "react";
import './MapPage.scss'

export default function MapPage() {
    return (
        <div className="map">
            <iframe src="https://map.pfaumc.io/" width="100%" height="100%">
            </iframe>
        </div>

    )
}
