// import domContentloader
// The DOMContentLoaded event fires when the browser has fully loaded the HTML and built the Document Object Model (DOM) tree, but has not necessarily finished loading external resources like images and stylesheets.The DOMContentLoaded event is best for initializing the user interface, attaching event handlers, and performing actions that only require the DOM to be ready.

document.addEventListener("DOMContentLoaded", () => {

  let detentionData, geojsonLayer;
  
  // relabel states 

  const stateNameMap = {
    "New South Wales": "NSW",
    "Victoria": "VIC",
    "Queensland": "QLD",
    "South Australia": "SA",
    "Western Australia": "WA",
    "Tasmania": "TAS",
    "Northern Territory": "NT",
    "Australian Capital Territory": "ACT"
  };
  
    // reference detention centres to states 

  const detentionInfo = {
    "NSW": "Youth detention in NSW is primarily provided at Frank Baxter, Cobham, Reiby and Riverina centres.",
    "VIC": "Victoria operates Parkville and Malmsbury Youth Justice Centres.",
    "QLD": "Queensland’s youth detention centres include Brisbane Youth Detention Centre and Cleveland Youth Detention Centre.",
    "SA": "South Australia operates the Kurlana Tapa Youth Justice Centre (formerly Magill).",
    "WA": "Western Australia operates Banksia Hill Detention Centre, the state's primary youth facility.",
    "TAS": "Tasmania operates the Ashley Youth Detention Centre.",
    "NT": "The Northern Territory operates Don Dale Youth Detention Centre and Alice Springs Youth Detention Centre.",
    "ACT": "The ACT operates the Bimberi Youth Justice Centre."
  };

      // update slider to include month + year 
  
  const quarters = [
    "June 2017", "September 2017", "December 2017",
    "March 2018", "June 2018", "September 2018", "December 2018",
    "March 2019", "June 2019", "September 2019", "December 2019",
    "March 2020", "June 2020", "September 2020", "December 2020",
    "March 2021", "June 2021", "September 2021", "December 2021",
    "March 2022", "June 2022", "September 2022", "December 2022",
    "March 2023", "June 2023", "September 2023", "December 2023",
    "March 2024", "June 2024", "September 2024", "December 2024",
    "March 2025", "June 2025"
  ];

  const getSelectedQuarter = () =>
    quarters[Number(document.getElementById("quarterSlider").value)];

  const getSelectedYear = () => getSelectedQuarter().split(" ")[1];
  const getSelectedMonth = () => getSelectedQuarter().split(" ")[0];
  const getSelectedID = () => document.getElementById("idFilter").value;
  const getSelectedSex = () => document.getElementById("sexFilter").value;
  const getSelectedSentence = () => document.getElementById("sentenceFilter").value;

      // data breaks for the chloropleth. 
  
  function getDynamicBreaks() {
    if (!detentionData) return [1, 5, 10, 20, 30];

    const year = getSelectedYear();
    const month = getSelectedMonth();
    const id = getSelectedID();
    const sex = getSelectedSex();
    const sentence = getSelectedSentence();

    const sexFilter = sex === "Total"
      ? (d => d.Sex === "Male" || d.Sex === "Female")
      : (d => d.Sex === sex);

    const values = detentionData
      .filter(d =>
        d.Year === year &&
        d.Month === month &&
        d.ID === id &&
        sexFilter(d) &&
        d["Sentence Type"] === sentence
      )
      .map(d => Number(d.Rate))
      .filter(v => v > 0);

    if (values.length === 0) return [1, 5, 10, 20, 30];

    values.sort((a, b) => a - b);

    return [
      values[Math.floor(values.length * 0.20)],
      values[Math.floor(values.length * 0.40)],
      values[Math.floor(values.length * 0.60)],
      values[Math.floor(values.length * 0.80)],
      values[values.length - 1]
    ];
  }

      // chloropleth colour  
  
  function getColor(rate, b) {
    return rate > b[4] ? '#49000a' :
           rate > b[3] ? '#7f0d13' :
           rate > b[2] ? '#b71c1c' :
           rate > b[1] ? '#e53935' :
           rate > b[0] ? '#ff7961' :
                         '#ffcccb';
  }

      // legend details 
  
function updateLegend() {
  const b = getDynamicBreaks().map(v => Math.round(v));
  const legendDiv = document.getElementById("legend");

  legendDiv.innerHTML = `
    <strong>Average daily detention rate<br>
    <span style="font-weight:normal;">per 10,000 young people</span></strong><br><br>

    <div><i style="background:#ffcccb;width:18px;height:18px;display:inline-block;margin-right:10px;border:1px solid #999;"></i>0 – ${b[0]}</div>
    <div><i style="background:#ff7961;width:18px;height:18px;display:inline-block;margin-right:10px;border:1px solid #999;"></i>${b[0]} – ${b[1]}</div>
    <div><i style="background:#e53935;width:18px;height:18px;display:inline-block;margin-right:10px;border:1px solid #999;"></i>${b[1]} – ${b[2]}</div>
    <div><i style="background:#b71c1c;width:18px;height:18px;display:inline-block;margin-right:10px;border:1px solid #999;"></i>${b[2]} – ${b[3]}</div>
    <div><i style="background:#7f0d13;width:18px;height:18px;display:inline-block;margin-right:10px;border:1px solid #999;"></i>${b[3]} – ${b[4]}</div>
    <div><i style="background:#49000a;width:18px;height:18px;display:inline-block;margin-right:10px;border:1px solid #999;"></i>${b[4]}+</div>
  `;
}


      // map features 
  
  function styleState(feature) {
    const breaks = getDynamicBreaks();
    const abbr = stateNameMap[feature.properties.STATE_NAME];
    const year = getSelectedYear();
    const month = getSelectedMonth();
    const id = getSelectedID();
    const sex = getSelectedSex();
    const sentence = getSelectedSentence();

    const sexFilter = sex === "Total"
      ? (d => d.Sex === "Male" || d.Sex === "Female")
      : (d => d.Sex === sex);

    const stateRecord = detentionData.find(d =>
      d.State === abbr &&
      d.Year === year &&
      d.Month === month &&
      d.ID === id &&
      sexFilter(d) &&
      d["Sentence Type"] === sentence
    ) || {};

    const rate = Number(stateRecord.Rate) || 0;

    return {
      fillColor: getColor(rate, breaks),
      weight: 1,
      color: "#333",
      fillOpacity: 0.7
    };
  }

      // pop up for when the user clicks on a state. intention is to show the rate per day. following code has altered the text to change according to year and hide irrelavant rows for a cleaner look.  
  
  
  function showPopup(e, stateName) {
    const abbr = stateNameMap[stateName];
    const year = getSelectedYear();
    const month = getSelectedMonth();
    const id = getSelectedID();
    const sex = getSelectedSex();
    const sentence = getSelectedSentence();

    const sexFilter = sex === "Total"
      ? (d => d.Sex === "Male" || d.Sex === "Female")
      : (d => d.Sex === sex);

    const record = detentionData.find(d =>
      d.State === abbr &&
      d.ID === id &&
      sexFilter(d) &&
      d["Sentence Type"] === sentence &&
      d.Year === year &&
      d.Month === month
    );

    const ageGroups = detentionData.filter(d =>
      d.State === abbr &&
      d.ID === id &&
      sexFilter(d) &&
      d["Sentence Type"] === sentence &&
      d.Year === year &&
      d.Month === month
    );

    const ageSummary = { "10-13": 0, "14-17": 0, "10-17": 0, "18+": 0 };

    ageGroups.forEach(d => {
      const rawAge = d.Age;

      if (rawAge === "10-13") ageSummary["10-13"] = Math.round(Number(d.Rate));
      else if (rawAge === "14-17") ageSummary["14-17"] = Math.round(Number(d.Rate));
      else if (rawAge === "10-17") ageSummary["10-17"] = Math.round(Number(d.Rate));
      else if (rawAge === "18+" || rawAge === "18") ageSummary["18+"] = Math.round(Number(d.Rate));
    });

      // making edits to the original python code for the website to handle the data 
    
    let ageHTML = "<strong>Age Breakdown:</strong><br>";

    if (ageSummary["10-13"] > 0) ageHTML += `10–13: ${ageSummary["10-13"]}<br>`;
    if (ageSummary["14-17"] > 0) ageHTML += `14–17: ${ageSummary["14-17"]}<br>`;
    if (ageSummary["10-17"] > 0) ageHTML += `10–17: ${ageSummary["10-17"]}<br>`;
    if (ageSummary["18+"] > 0) ageHTML += `18+: ${ageSummary["18+"]}<br>`;

    if (
      ageSummary["10-13"] === 0 &&
      ageSummary["14-17"] === 0 &&
      ageSummary["10-17"] === 0 &&
      ageSummary["18+"] === 0
    ) {
      ageHTML += "No age-specific data available<br>";
    }

    const popupHTML = `
      <strong>${stateName}</strong><br>
      <strong>Year:</strong> ${year}<br>
      <strong>Quarter:</strong> ${month}<br>
      <strong>Detention Rate:</strong> ${record?.Rate ?? "N/A"}<br>
      <strong>Average Count (AUS):</strong> ${record?.AUS ?? "N/A"}<br><br>
      ${ageHTML}
    `;

    L.popup()
      .setLatLng(e.latlng)
      .setContent(popupHTML)
      .openOn(e.target._map);
  }

      // config map 
  
  const map = L.map("map", { zoomControl: true }).setView([-28, 133], 4);

      // base map from carto  
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);

      // fetch data for youth detention rates 
  
  const DATA_URL = "https://raw.githubusercontent.com/MarthaTaylor5/Martha-Taylor/refs/heads/main/youthdetention_17_25_cp.json";
  
     // fetch source for states polygon 
  
  const STATES_URL = "https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson";

  fetch(DATA_URL)
    .then(res => res.json())
    .then(data => {
      detentionData = data;
      return fetch(STATES_URL);
    })
    .then(res => res.json())
    .then(geoData => {
      geojsonLayer = L.geoJson(geoData, {
        style: styleState,
        onEachFeature: (feature, layer) => {

          layer.on({
            mouseover: e => e.target.setStyle({ weight: 2, color: "#fff", fillOpacity: 0.9 }),
            mouseout: e => geojsonLayer.resetStyle(e.target),
            click: e => {
              document.getElementById("selectedState").textContent = feature.properties.STATE_NAME;

              const abbr = stateNameMap[feature.properties.STATE_NAME];
              document.getElementById("context-data").innerHTML =
                detentionInfo[abbr] || "No detention centre information available.";

              showPopup(e, feature.properties.STATE_NAME);
            }
          });
        }
      }).addTo(map);

      updateLegend();
    });

     // interactive actions 
  
  const quarterSlider = document.getElementById("quarterSlider");
  const quarterLabel = document.getElementById("quarterLabel");
  quarterLabel.textContent = getSelectedQuarter();

     // map updates in response to the interaction with slider 
  
  quarterSlider.addEventListener("input", () => {
    quarterLabel.textContent = getSelectedQuarter();
    geojsonLayer?.setStyle(styleState);
    updateLegend();
  });
  
    // map updates in response to filters 

  document.getElementById("idFilter").addEventListener("change", () => {
    geojsonLayer?.setStyle(styleState);
    updateLegend();
  });

  document.getElementById("sexFilter").addEventListener("change", () => {
    geojsonLayer?.setStyle(styleState);
    updateLegend();
  });

  document.getElementById("sentenceFilter").addEventListener("change", () => {
    geojsonLayer?.setStyle(styleState);
    updateLegend();
  });
  
  
 // function for intro modal 

window.closeIntro = function () {
  const modal = document.getElementById("introModal");
  if (modal) modal.remove();
};

}); // END DOMContentLoaded


 // end of JS  

