import React from 'react'
import './404.scss'
import SocialIcons from "../Components/SocialIcons"
import BlackBar from '../Components/BlackBar';
import Fireflies from '../Components/Fireflies';

export default function NotFoundPage() {
    return (
        <div className="NotFoundPage back_img ">
            <BlackBar />
            <div className="NotFoundPage_Content">
                <h1>Кажется страница которую вы пытаетесь найти - не существует :(</h1>
                <SocialIcons/>
                <Fireflies/>
            </div>
        </div>
    )
}