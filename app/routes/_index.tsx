/* eslint-disable @typescript-eslint/no-explicit-any */
import { json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { useEffect, useMemo, useRef, useState } from "react";

import { Coordinates } from "~/types";
import {
  Stack,
  TextField,
  Chip,
  Button,
  Grid2,
  Card,
  Container,
  Typography,
  CardContent,
  Autocomplete,
} from "@mui/material";
import { LocationSearchingOutlined } from "@mui/icons-material";

import { WeatherTab } from "~/components/WeatherTab";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async () => {
  return json({
    weatherApiKey: process.env.WEATHER_KEY,
  });
};

export default function Index() {
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [goto, setGoto] = useState("");
  const [search, setSearch] = useState<string | null>(null);
  const mapRef = useRef<any>();
  const searchOptions = ["Restaurant", "Cinema"];
  const [place, setPlace] = useState<{
    name: string;
    coordinates: [number, number];
  }>();
  const directionRef = useRef<any>();
  const [forecast, setForecast] = useState<any[] | any>();
  const groupedForecast = useMemo(
    () =>
      forecast
        ? forecast && Array.isArray(forecast)
          ? forecast.reduce(
              (groups: { [x: string]: any[] }, item: { date: string }) => {
                const date = item.date;

                if (!groups[date]) {
                  groups[date] = []; // Initialize group if not already created
                }

                groups[date].push(item); // Add the item to the appropriate group
                return groups;
              },
              {}
            )
          : { [forecast.date]: forecast }
        : forecast,
    [forecast]
  );
  const { weatherApiKey } = useLoaderData<typeof loader>();

  useEffect(() => {
    const location = navigator.geolocation;
    const getPositionSuccess = (position: GeolocationPosition) => {
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    };
    location.getCurrentPosition(getPositionSuccess, (error) => {
      console.log(error);
    });
  }, []);

  useEffect(() => {
    if (coordinates) {
      const { latitude, longitude } = coordinates;
      if (!mapRef.current)
        mapRef.current = L.map("map", {
          center: [latitude, longitude],
          zoom: 14,
        });
      const map = mapRef.current as any;
      map.flyTo([latitude, longitude], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      L.marker([coordinates.latitude, coordinates.longitude])
        .addTo(map)
        .bindPopup("You are here.")
        .openPopup(); 
    }
  }, [coordinates]);

  useEffect(() => {
    if (search && coordinates) {
      const map = mapRef.current;
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${search}&format=json&limit=10&viewbox=${
          coordinates.longitude - 0.05
        },${coordinates.latitude + 0.05},${coordinates.longitude + 0.05},${
          coordinates.latitude - 0.05
        }&bounded=1`
      )
        .then((response) => response.json())
        .then((data) => {
          data.forEach(
            (place: { lat: number; lon: number; display_name: any }) => {
              const marker = L.marker([place.lat, place.lon]);
              marker
                .addTo(map)
                .bindPopup(
                  `${place.display_name}
              Click on marker to see more`
                )
                .openPopup();
              marker.on("click", () => {
                setPlace({
                  name: place.display_name,
                  coordinates: [place.lat, place.lon],
                });
              });
            }
          );
        })
        .catch((error) => console.error("Error fetching places:", error));
    }
  }, [coordinates, search]);

  useEffect(() => {
    if (place && coordinates) {
      const map = mapRef.current;
      if (directionRef.current) map.removeControl(directionRef.current);
      directionRef.current = L.Routing.control({
        waypoints: [
          L.latLng(coordinates.latitude, coordinates.longitude), // Starting point (Latitude, Longitude)
          L.latLng(place.coordinates[0], place.coordinates[1]), // Destination point
        ],
        routeWhileDragging: true,
      }).addTo(map);
    }
  }, [place, coordinates]);

  if (coordinates)
    return (
      <Grid2
        height="inherit"
        alignItems="center"
        container
        wrap="wrap-reverse"
        spacing={3}
      >
        <Grid2 height="inherit" size={{ xs: 12, md: 8 }}>
          {place && (
            <Card sx={{ marginBottom: 5 }}>
              <CardContent>
                <Stack spacing={3} alignItems="center">
                  <Typography textAlign="center" variant="h5">
                    {place.name}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
          {groupedForecast && (
            <Card sx={{ marginBottom: 5 }}>
              <CardContent>
                <Stack spacing={3}>
                  <Typography margin="auto" textAlign="center" variant="h5">
                    Your Weather Information
                  </Typography>
                  <WeatherTab forecast={groupedForecast} />
                </Stack>
              </CardContent>
            </Card>
          )}
          <Card elevation={5} sx={{ height: "100%" }} id="map"></Card>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                {goto.length == 0 ? (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => {
                      setGoto("goto");
                    }}
                  >
                    Go anywhere
                  </Button>
                ) : (
                  <TextField
                    placeholder="Go anywhere"
                    onChange={(e) => {
                      setGoto(e.target.value);
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <Chip
                            onClick={() => {
                              fetch(
                                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                                  goto
                                )}&format=json&limit=1`
                              )
                                .then((response) => response.json())
                                .then((data) => {
                                  const latitude = parseFloat(data[0].lat);
                                  const longitude = parseFloat(data[0].lon);
                                  setCoordinates({ latitude, longitude });
                                })
                                .catch((error) =>
                                  console.error("Error:", error)
                                );
                            }}
                            label="Go to"
                            color="primary"
                            icon={<LocationSearchingOutlined />}
                          />
                        ),
                      },
                    }}
                  />
                )}
                <Autocomplete
                  value={search}
                  onChange={(e, newValue) => {
                    setSearch(newValue);
                  }}
                  disablePortal
                  options={searchOptions}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search for interesting places and landmarks"
                    />
                  )}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${weatherApiKey}&units=metric`;
                    fetch(url)
                      .then((response) => response.json())
                      .then((data) => {
                        setForecast({
                          temperature: data.main.temp,
                          weatherDescription: data.weather[0].description,
                          date: new Date().toDateString(),
                        });
                      })
                      .catch((error) =>
                        console.error("Error fetching weather data:", error)
                      );
                  }}
                >
                  Get daily Weather info
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  onClick={() => {
                    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${weatherApiKey}&units=metric`;
                    fetch(url)
                      .then((response) => response.json())
                      .then((data) => {
                        setForecast(
                          data.list.map(
                            (forecast: {
                              main: { temp: any };
                              weather: { description: any }[];
                              dt_txt: string;
                            }) => ({
                              temperature: forecast.main.temp,
                              weatherDescription:
                                forecast.weather[0].description,
                              date: new Date(forecast.dt_txt).toDateString(),
                            })
                          )
                        );
                      })
                      .catch((error) =>
                        console.error("Error fetching weather data:", error)
                      );
                  }}
                >
                  Get Weather Forecast
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    );
  return (
    <Container maxWidth="sm" sx={{ height: "inherit" }}>
      <Stack
        alignItems="center"
        justifyContent="center"
        height="inherit"
        spacing={3}
      >
        <Typography variant="h1">Please</Typography>
        <Typography variant="h2" textAlign="center">
          Give access to location to use this service
        </Typography>
      </Stack>
    </Container>
  );
}
