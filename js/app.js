// global Google maps variable
var map;
// global Zoo data
var zoosData = [
  {
    name: 'Basel Zoo',
    lat: 47.547336,
    lon: 7.578764
  },
  {
    name: 'London Zoo',
    lat: 51.535556,
    lon: -0.155833
  },
  {
    name: 'Prague Zoo',
    lat: 50.116944,
    lon: 14.406111
  },
  {
    name: 'Chester Zoo',
    lat: 53.226667,
    lon: -2.884167
  },
  {
    name: 'Dublin Zoo',
    lat: 53.353889,
    lon: -6.303889
  },
  {
    name: 'Whipsnade Zoo',
    lat: 51.849722,
    lon: -0.544167
  },
  {
    name: 'Copenhagen Zoo',
    lat: 55.672778,
    lon: 12.521389
  },
  {
    name: 'Berlin Zoological Garden',
    lat: 52.508333,
    lon: 13.3375
  },
  {
    name: 'Alpenzoo Innsbruck',
    lat: 47.280556,
    lon: 11.398056
  },
  {
    name: 'Pionirska dolina',
    lat: 43.877614,
    lon: 18.411847
  },
  {
    name: 'Sofia Zoo',
    lat: 42.658056,
    lon: 23.331944
  },
  {
    name: 'Zagreb Zoo',
    lat: 45.822778,
    lon: 16.021944
  },
  {
    name: 'Ljubljana Zoo',
    lat: 46.052569,
    lon: 14.472244
  },
  {
    name: 'Warsaw Zoo',
    lat: 52.257778,
    lon: 21.022222
  },
  {
    name: 'Paris Zoological Park',
    lat: 48.8322,
    lon: 2.4186
  },
  {
    name: 'Valencia Biopark',
    lat: 39.478,
    lon: -0.407
  },
  {
    name: 'Bioparco di Roma',
    lat: 41.9175,
    lon: 12.485278
  },
];

// basic Zoo object
var Zoo = function(data) {
  this.name = ko.observable(data.name);
  this.lat = ko.observable(data.lat);
  this.lon = ko.observable(data.lon);
  this.marker = data.marker;
};

// init callback for Google Maps
// function must be global, due to the way the API makes a callback
// to this method during initialization
function initMap() {
  var zoo = zoosData[0];
  var myLatLng = {lat: zoo.lat, lng: zoo.lon};

  // Create a map object and specify the DOM element for display.
  map = new google.maps.Map(document.getElementById('map'), {
    center: myLatLng,
    mapTypeControl: false,
    zoom: 5
  });
}

// helper function to get the first property of an object
function getFirstProperty(obj) {
  for (var i in obj)
    return obj[i];
}

// autocomplete for search
ko.bindingHandlers.ko_autocomplete = {
  init: function (element, params) {
      $(element).autocomplete(params());
  },
  update: function (element, params) {
      $(element).autocomplete("option", "source", params().source);
  }
};

$(function() {
  // setup menu toggle button
  $('#menu-toggle').click(function(e) {
      e.preventDefault();
      $('#wrapper').toggleClass('toggled');
  });

  // KnockoutJS
  var ViewModel = function() {
    var self = this;
    var infoBox = new google.maps.InfoWindow();
    var zooNames = []; // used for autocomplete

    self.search = ko.observable();
    self.selectedZoo = ko.observable();
    self.zooList = ko.observableArray([]);

    // Initialize the observable array and create markers. Is there maybe a better way to store markers ?
    zoosData.forEach(function(zooData) {
      var marker = new google.maps.Marker({
        map: map,
        position: {
          lat: zooData.lat,
          lng: zooData.lon
        },
        title: zooData.name
      });
      zooData.marker = marker;
      var zoo = new Zoo(zooData);
      self.zooList.push(zoo);
      zooNames.push({label: zooData.name, value: 0});
      marker.addListener('click', function() {
        self.setSelectedZoo(zoo);
      });
    });

    self.getZooList = function() {
      return zooNames;
    };

    self.setSearch = function(event, ui) {
      $(event.target).val("");
      self.search(ui.item.label);
    };

    // function loads marker infoWindow contents and displays the window
    self.load_marker_content = function (map, marker, zoo) {
      $.ajax({
        url: 'https://en.wokipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles='+encodeURIComponent(zoo.name()),
        dataType: "jsonp",
        timeout: 3000,
        success: function(data) {
          infoBox.setContent(getFirstProperty(data.query.pages).extract);
          infoBox.open(map, marker);
        },
        error: function(x, t, m) {
          if(t==="timeout") {
            infoBox.setContent('Sorry, could not load data from Wikipedia.');
            infoBox.open(map, marker);
          }
        }
      });
    };

    // function selects a Zoo, and also animated the marker and shows its info window
    self.setSelectedZoo = function(zoo) {
      // clear any old animation first
      if (self.selectedZoo()) {
        var marker = self.selectedZoo().marker;
        if (marker !== null && marker.getAnimation() !== null) {
          marker.setAnimation(null);
        }
      }
      self.selectedZoo(zoo);
      zoo.marker.setAnimation(google.maps.Animation.DROP);
      self.load_marker_content(map, zoo.marker, zoo);
    };

    // returns Zoos filtered by 'search' keyword
    self.searchedZoos = ko.computed(function() {
      return ko.utils.arrayFilter(self.zooList(), function(zoo) {
        if (!self.search())  // if search is empty, display all
        {
          zoo.marker.setVisible(true);
          return true;
        }
        var match = zoo.name().toLowerCase().indexOf(self.search().toLowerCase()) != -1; // case insensitive search
        if (match)
          zoo.marker.setVisible(true);
        else
          zoo.marker.setVisible(false);
        return match;
      });
    });
  };
  ko.applyBindings(new ViewModel());
});
