const mapElement = document.getElementById("map");

const coordinates = JSON.parse(
    mapElement.dataset.coordinates
);

const title = mapElement.dataset.title;
const location = mapElement.dataset.location;


const map = new maplibregl.Map({
    container: "map",
    style: "https://tiles.openfreemap.org/styles/bright",
    center: coordinates,//lag and lat
    zoom: 9//zoom mzp
});

const popup = new maplibregl.Popup({
    offset: 25,
    closeButton: true,
    closeOnClick: true
}).setHTML(`
    <div class="map-popup">
        <h5>${title}</h5>
        <p>📍 ${location}</p>
    </div>
`);

new maplibregl.Marker({color:"red"})
    .setLngLat(coordinates)
    .setPopup(popup)
    .addTo(map);