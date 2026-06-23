export const theatres = [
  {
    name: 'PVR INOX Nexus',
    location: 'Koramangala, Bengaluru, Karnataka',
    totalScreens: 8,
  },
  {
    name: 'INOX Nariman Point',
    location: 'Marine Drive, Mumbai, Maharashtra',
    totalScreens: 6,
  },
  {
    name: 'Sathyam Cinemas',
    location: 'Royapettah, Chennai, Tamil Nadu',
    totalScreens: 7,
  },
  {
    name: 'Nandan Cinema',
    location: 'Rabindra Sadan, Kolkata, West Bengal',
    totalScreens: 5,
  },
  {
    name: 'PVR Lulu Mall',
    location: 'Edappally, Kochi, Kerala',
    totalScreens: 9,
  },
  {
    name: 'AMB Cinemas',
    location: 'Gachibowli, Hyderabad, Telangana',
    totalScreens: 10,
  },
  {
    name: 'Asian Cinemas CMR',
    location: 'Labbipet, Vijayawada, Andhra Pradesh',
    totalScreens: 6,
  },
  {
    name: 'Raj Mandir Cinema',
    location: 'Bhagwan Das Road, Jaipur, Rajasthan',
    totalScreens: 4,
  },
  {
    name: 'PVR Sahara Mall',
    location: 'MG Road, Gurugram, Haryana',
    totalScreens: 7,
  },
  {
    name: 'Wave Cinemas',
    location: 'Gomti Nagar, Lucknow, Uttar Pradesh',
    totalScreens: 8,
  },
  {
    name: 'Cinepolis Treasure Island',
    location: 'CG Road, Ahmedabad, Gujarat',
    totalScreens: 6,
  },
  {
    name: 'INOX Aashima Mall',
    location: 'MP Nagar, Bhopal, Madhya Pradesh',
    totalScreens: 5,
  },
  {
    name: 'PVR Forum Mall',
    location: 'Elgin Road, Ranchi, Jharkhand',
    totalScreens: 4,
  },
  {
    name: 'Cinepolis Boring Road',
    location: 'Boring Road, Patna, Bihar',
    totalScreens: 5,
  },
  {
    name: 'INOX City Centre',
    location: 'GS Road, Guwahati, Assam',
    totalScreens: 4,
  },
  {
    name: 'PVR Magneto Mall',
    location: 'Labhandi, Raipur, Chhattisgarh',
    totalScreens: 5,
  },
  {
    name: 'INOX Panjim',
    location: 'DB Marg, Panaji, Goa',
    totalScreens: 3,
  },
  {
    name: 'Cinepolis VR Punjab',
    location: 'Sahibzada Ajit Singh Nagar, Punjab',
    totalScreens: 7,
  },
  {
    name: 'PVR Esplanade',
    location: 'Sahid Nagar, Bhubaneswar, Odisha',
    totalScreens: 5,
  },
  {
    name: 'INOX Regenta',
    location: 'Rajpur Road, Dehradun, Uttarakhand',
    totalScreens: 4,
  },
  {
    name: 'PVR Mall Road',
    location: 'Mall Road, Shimla, Himachal Pradesh',
    totalScreens: 3,
  },
  {
    name: 'INOX Polo Towers',
    location: 'MG Marg, Gangtok, Sikkim',
    totalScreens: 2,
  },
  {
    name: 'Gold Cinema Imphal',
    location: 'Thangal Bazaar, Imphal, Manipur',
    totalScreens: 2,
  },
  {
    name: 'Bijou Cinema',
    location: 'Police Bazaar, Shillong, Meghalaya',
    totalScreens: 2,
  },
  {
    name: 'Zoram Cinema',
    location: 'Zarkawt, Aizawl, Mizoram',
    totalScreens: 2,
  },
  {
    name: 'Nagaland Cinema Hall',
    location: 'Midland, Dimapur, Nagaland',
    totalScreens: 2,
  },
  {
    name: 'Rupasi Cinema',
    location: 'Agartala, Tripura',
    totalScreens: 2,
  },
  {
    name: 'Cineplex Itanagar',
    location: 'Ganga Market, Itanagar, Arunachal Pradesh',
    totalScreens: 2,
  },
];

export const movies = [
  {
    title: 'The Last Horizon',
    genre: 'Sci-Fi',
    durationMinutes: 142,
    rating: 'PG-13',
    posterUrl: null,
  },
  {
    title: 'Midnight in Havana',
    genre: 'Drama',
    durationMinutes: 118,
    rating: 'R',
    posterUrl: null,
  },
  {
    title: 'Turbo Rush',
    genre: 'Action',
    durationMinutes: 126,
    rating: 'PG-13',
    posterUrl: null,
  },
  {
    title: 'The Enchanted Garden',
    genre: 'Animation',
    durationMinutes: 98,
    rating: 'G',
    posterUrl: null,
  },
  {
    title: 'Code Red',
    genre: 'Thriller',
    durationMinutes: 110,
    rating: 'R',
    posterUrl: null,
  },
  {
    title: 'Love in Transit',
    genre: 'Romance',
    durationMinutes: 105,
    rating: 'PG-13',
    posterUrl: null,
  },
  {
    title: 'Echoes of Tomorrow',
    genre: 'Sci-Fi',
    durationMinutes: 135,
    rating: 'PG-13',
    posterUrl: null,
  },
];

export interface ShowtimeSeed {
  theatreIndex: number;
  movieIndex: number;
  screen: string;
  startTime: string;
  price: number;
}

export const showtimes: ShowtimeSeed[] = [
  {
    theatreIndex: 0,
    movieIndex: 0,
    screen: '1',
    startTime: '2026-06-20T14:00:00Z',
    price: 14.99,
  },
  {
    theatreIndex: 0,
    movieIndex: 1,
    screen: '2',
    startTime: '2026-06-20T16:30:00Z',
    price: 12.99,
  },
  {
    theatreIndex: 0,
    movieIndex: 3,
    screen: '3',
    startTime: '2026-06-20T11:00:00Z',
    price: 10.99,
  },
  {
    theatreIndex: 1,
    movieIndex: 0,
    screen: '1',
    startTime: '2026-06-20T19:00:00Z',
    price: 18.99,
  },
  {
    theatreIndex: 1,
    movieIndex: 2,
    screen: '2',
    startTime: '2026-06-20T21:00:00Z',
    price: 17.99,
  },
  {
    theatreIndex: 2,
    movieIndex: 4,
    screen: '1',
    startTime: '2026-06-20T15:00:00Z',
    price: 13.99,
  },
  {
    theatreIndex: 2,
    movieIndex: 5,
    screen: '3',
    startTime: '2026-06-20T18:00:00Z',
    price: 12.99,
  },
  {
    theatreIndex: 2,
    movieIndex: 6,
    screen: '5',
    startTime: '2026-06-20T20:30:00Z',
    price: 14.99,
  },
  {
    theatreIndex: 3,
    movieIndex: 1,
    screen: '1',
    startTime: '2026-06-20T13:00:00Z',
    price: 11.99,
  },
  {
    theatreIndex: 3,
    movieIndex: 2,
    screen: '2',
    startTime: '2026-06-20T17:00:00Z',
    price: 12.99,
  },
  {
    theatreIndex: 4,
    movieIndex: 3,
    screen: '1',
    startTime: '2026-06-20T10:00:00Z',
    price: 9.99,
  },
  {
    theatreIndex: 4,
    movieIndex: 6,
    screen: '4',
    startTime: '2026-06-20T22:00:00Z',
    price: 15.99,
  },
];

export const menuItems = [
  {
    name: 'Classic Popcorn',
    description: 'Freshly popped buttered popcorn',
    category: 'Snacks',
    size: 'Regular',
    basePrice: 6.99,
  },
  {
    name: 'Nachos Supreme',
    description: 'Crispy tortilla chips with cheese sauce and jalapenos',
    category: 'Snacks',
    size: 'Large',
    basePrice: 8.49,
  },
  {
    name: 'Hot Dog',
    description: 'All-beef frank with mustard and ketchup',
    category: 'Snacks',
    size: null,
    basePrice: 5.99,
  },
  {
    name: 'Pepsi',
    description: 'Chilled Pepsi (500ml)',
    category: 'Beverages',
    size: '500ml',
    basePrice: 3.99,
  },
  {
    name: 'Iced Lemonade',
    description: 'Freshly squeezed lemonade with ice',
    category: 'Beverages',
    size: '350ml',
    basePrice: 4.49,
  },
  {
    name: 'Bottled Water',
    description: 'Still mineral water (500ml)',
    category: 'Beverages',
    size: '500ml',
    basePrice: 2.49,
  },
  {
    name: 'Chocolate Brownie',
    description: 'Warm fudge brownie with chocolate chips',
    category: 'Desserts',
    size: null,
    basePrice: 5.49,
  },
  {
    name: 'Ice Cream Cup',
    description: 'Vanilla and chocolate swirl cup',
    category: 'Desserts',
    size: 'Small',
    basePrice: 4.99,
  },
];

export interface InventorySeed {
  theatreIndex: number;
  menuItemIndex: number;
  quantity: number;
}

export const inventoryItems: InventorySeed[] = [
  { theatreIndex: 0, menuItemIndex: 0, quantity: 50 },
  { theatreIndex: 0, menuItemIndex: 1, quantity: 30 },
  { theatreIndex: 0, menuItemIndex: 2, quantity: 25 },
  { theatreIndex: 0, menuItemIndex: 3, quantity: 80 },
  { theatreIndex: 0, menuItemIndex: 4, quantity: 40 },
  { theatreIndex: 0, menuItemIndex: 5, quantity: 100 },
  { theatreIndex: 0, menuItemIndex: 6, quantity: 20 },
  { theatreIndex: 0, menuItemIndex: 7, quantity: 15 },
  { theatreIndex: 1, menuItemIndex: 0, quantity: 40 },
  { theatreIndex: 1, menuItemIndex: 1, quantity: 20 },
  { theatreIndex: 1, menuItemIndex: 3, quantity: 60 },
  { theatreIndex: 1, menuItemIndex: 5, quantity: 70 },
  { theatreIndex: 1, menuItemIndex: 6, quantity: 15 },
  { theatreIndex: 2, menuItemIndex: 0, quantity: 60 },
  { theatreIndex: 2, menuItemIndex: 2, quantity: 35 },
  { theatreIndex: 2, menuItemIndex: 3, quantity: 90 },
  { theatreIndex: 2, menuItemIndex: 4, quantity: 45 },
  { theatreIndex: 2, menuItemIndex: 7, quantity: 25 },
  { theatreIndex: 3, menuItemIndex: 0, quantity: 45 },
  { theatreIndex: 3, menuItemIndex: 1, quantity: 25 },
  { theatreIndex: 3, menuItemIndex: 3, quantity: 55 },
  { theatreIndex: 3, menuItemIndex: 6, quantity: 10 },
  { theatreIndex: 4, menuItemIndex: 0, quantity: 70 },
  { theatreIndex: 4, menuItemIndex: 1, quantity: 35 },
  { theatreIndex: 4, menuItemIndex: 2, quantity: 30 },
  { theatreIndex: 4, menuItemIndex: 3, quantity: 100 },
  { theatreIndex: 4, menuItemIndex: 4, quantity: 50 },
  { theatreIndex: 4, menuItemIndex: 5, quantity: 120 },
  { theatreIndex: 4, menuItemIndex: 6, quantity: 25 },
  { theatreIndex: 4, menuItemIndex: 7, quantity: 20 },
];
