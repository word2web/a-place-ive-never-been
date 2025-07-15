# A Place I've Never Been

A wee web application that generates random coordinates within a specified radius from a starting point. Perfect for discovering new places to explore! 

If you live near the coast please bear in mind that some of the random places might be underwater: so get your diving gear ready 🤿 😉

## Features

- Generate random coordinates within a customizable radius
- Display coordinates in both decimal and DMS (Degrees, Minutes, Seconds) format
- Calculate exact distance from starting point
- Direct link to Google Maps for easy navigation
- Modern, responsive design with Tailwind CSS
- Fast and lightweight React/Next.js application
- Place search with automatic coordinate filling
- Manual coordinate editing capabilities
- Unit toggle between miles and kilometers

## Live Demo

Visit the live application at: [https://a-place-never-been.vercel.app/]

## Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd a-place-ive-never-been
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on every push

The app includes a `vercel.json` configuration file for optimal deployment settings.

## How It Works

The application uses mathematical formulas to generate truly random coordinates within a specified radius:

1. **Haversine Formula**: Calculates distances between coordinates on Earth's surface
2. **Spherical Trigonometry**: Generates random points within a circular radius
3. **Coordinate Conversion**: Converts between decimal degrees and DMS format
4. **Geocoding**: Uses OpenStreetMap's Nominatim service for place search

## Default Starting Point

The app uses Edinburgh, Scotland as the default starting point:
- Latitude: 55°46'27"N
- Longitude: 3°55'6"W

You can easily modify this in the code to use any location as your starting point.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vercel** - Deployment platform
- **OpenStreetMap Nominatim** - Geocoding service


## TODO (MAYBE)

- [ ] Include automatic geolocation option

## Acknowledgments

This project was developed with the assistance of **Claude Sonnet 4**, an AI coding assistant, through the **Cursor IDE**. The AI helped transform a simple Python script into a full-featured web application, implementing:

- Modern React/Next.js architecture
- Responsive UI design with Tailwind CSS
- Place search functionality with geocoding
- Unit conversion features
- Deployment optimization for Vercel

Special thanks to the Cursor team for providing an excellent development environment that makes AI-assisted coding a seamless experience.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
