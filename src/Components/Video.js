import React from 'react';

class YouTubeVideo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            videoId: props.videoId
        };
    }

    render() {
        const {videoId} = this.state;
        const videoUrl = `https://www.youtube.com/embed/${videoId}`;

        return (
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-8">
                        <div style={{maxWidth: '1000px', width: '100%', paddingTop: '56.25%', position: 'relative'}}>
                            <iframe
                                title="YouTube Video"
                                style={{position: 'absolute', width: '100%', height: '100%', top: 0, left: 0}}
                                src={videoUrl}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default YouTubeVideo;
