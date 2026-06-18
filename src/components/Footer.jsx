import {
  BsShuffle,
  BsFillPlayCircleFill,
  BsFillSkipStartFill,
  BsFillSkipEndFill,
  BsRepeat,
  BsList,
  BsLaptop,
  BsFullscreen,
} from "react-icons/bs";

import {MdDevices,MdQueueMusic,MdVolumeUp} from "react-icons/md";
import {TbMicrophone2} from "react-icons/tb";

import { BiFullscreen } from "react-icons/bi";



function Footer() {
  return (
    <footer className="footer">

      <div className="footer-left">
        <img
          src="https://via.placeholder.com/56"
          alt="song"
          className="album-cover"
        />

        <div className="song-info">
          <h4>Song</h4>
          <p>Music Video • Singer</p>
        </div>

          <span className="check">✔️</span>
      </div>

      <div className="footer-center">

        <div className="player-controls">
          <BsShuffle />
          <BsFillSkipStartFill />
          <BsFillPlayCircleFill className="play-btn" />
          <BsFillSkipEndFill />
          <BsRepeat />
        </div>

        <div className="progress-section">
          <span>0:00</span>
          <input type="range" />
          <span>0:00</span>
        </div>

      </div>

      <div className="footer-right">
        <TbMicrophone2 />
        <MdQueueMusic />
        <MdDevices />
        <MdVolumeUp />
        <input type="range" className="volume-slider" />
      </div>

    </footer>
  );
}

export default Footer;