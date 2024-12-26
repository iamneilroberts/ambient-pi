import React, { useState, useEffect } from "react";
import axios from "axios";
import './SpaceLaunches.css';

const SpaceLaunches = () => {
  const [launches, setLaunches] = useState([]);
  const [error, setError] = useState(null);
  const API_URL = "https://llapi.thespacedevs.com/2.2.0/launch/upcoming/";

  useEffect(() => {
    const fetchLaunches = async () => {
      try {
        const response = await axios.get(API_URL);
        setLaunches(response.data.results);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchLaunches();
  }, []);

  return (
    <div className="space-launches">
      <h2 className="title">Upcoming Space Launches</h2>
      {error ? (
        <p className="error">Error loading launches: {error}</p>
      ) : (
        <div className="launch-list">
          {launches.map((launch) => (
            <div key={launch.id} className="launch-card">
              <img
                src={launch.image || "default-launch.jpg"}
                alt={launch.name}
                className="launch-image"
              />
              <div className="launch-details">
                <h3 className="launch-name">{launch.name}</h3>
                <p className="launch-mission">{launch.mission?.name || "N/A"}</p>
                <p className="launch-time">
                  Launch Time: {new Date(launch.net).toLocaleString()}
                </p>
                <p className="launch-provider">{launch.launch_service_provider.name}</p>
                <a
                  href={launch.webcast || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="launch-webcast"
                >
                  Watch Live
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpaceLaunches;

