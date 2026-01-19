export const PARTICIPANTS = [
  "Nei", "Carmen", "Thiago", "Aneta", "Alexandre", "Neide", 
  "Marcão", "Pedrinho", "Mari", "Felipe Messner", "Roberto", 
  "Esposa do Roberto", "Fabi", "Luciano", "Marcio", "Fatima", 
  "Bruno", "Haroldo", "Aline", "Marco", "Analice", "Ney", 
  "Katia", "Miguel"
] as const;

export const BARS = [
  { id: 1, name: "Pavão Azul", address: "R. Hilário de Gouveia, 71 - Copa", scheduledTime: "15:00", order: 1 },
  { id: 2, name: "Chanchada", address: "R. Gen. Polidoro, 164 - Bota", scheduledTime: "16:20", order: 2 },
  { id: 3, name: "Rio Tap Beer House", address: "Tv. dos Tamoios, 32 - Flamengo", scheduledTime: "17:30", order: 3 },
  { id: 4, name: "Suru", address: "R. da Lapa, 151 - Lapa", scheduledTime: "19:00", order: 4 },
  { id: 5, name: "Bar da Frente", address: "R. Barão de Iguatemi, 388 - Pça Band", scheduledTime: "20:20", order: 5 },
  { id: 6, name: "Noo Cachaçaria", address: "R. Barão de Iguatemi, 458 - Pça Band", scheduledTime: "21:30", order: 6 },
  { id: 7, name: "Bar Miudinho", address: "R. Dona Maria, 68 - Tijuca", scheduledTime: "22:45", order: 7 },
  { id: 8, name: "Baródromo", address: "R. Dona Zulmira, 115 - Maraca", scheduledTime: "23:55", order: 8 },
  { id: 9, name: "Fregola", address: "R. Geminiano Góis, 70 - Freguesia", scheduledTime: "01:30", order: 9 },
] as const;

export const BAR_COORDINATES: Record<number, [number, number]> = {
  1: [-22.9674, -43.1868], // Pavão Azul - Copacabana
  2: [-22.9519, -43.1869], // Chanchada - Botafogo
  3: [-22.9328, -43.1749], // Rio Tap Beer House - Flamengo
  4: [-22.9119, -43.1807], // Suru - Lapa
  5: [-22.9158, -43.1799], // Bar da Frente - Praça Bandeira
  6: [-22.9155, -43.1795], // Noo Cachaçaria - Praça Bandeira
  7: [-22.9224, -43.2323], // Bar Miudinho - Tijuca
  8: [-22.9121, -43.2292], // Baródromo - Maracanã
  9: [-22.9422, -43.3425], // Fregola - Freguesia
};

export type VanStatus = 'at_bar' | 'in_transit';

export interface AppConfig {
  status: VanStatus;
  currentBarId: number;
  originBarId?: number;
  destinationBarId?: number;
  globalDelayMinutes: number;
  broadcastMsg?: string;
}

export interface TranslationStrings {
  drink: string;
  food: string;
  vibe: string;
  service: string;
  atBar: string;
  inTransit: string;
  selectName: string;
  welcome: string;
  currentBar: string;
  nextBar: string;
  arrivalProjection: string;
  totalDrinks: string;
  totalFood: string;
  baratometer: string;
  vote: string;
  admin: string;
  delay: string;
  minutes: string;
  broadcast: string;
  callUber: string;
  sosNei: string;
  map: string;
  completed: string;
  current: string;
  upcoming: string;
}

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
  pt: {
    drink: "Bebida",
    food: "Comida", 
    vibe: "Vibe",
    service: "Atendimento",
    atBar: "No Bar",
    inTransit: "Em Deslocamento",
    selectName: "Selecione seu nome",
    welcome: "Bem-vindo à Baratona!",
    currentBar: "Bar Atual",
    nextBar: "Próximo Bar",
    arrivalProjection: "Projeção de Chegada",
    totalDrinks: "Total de Bebidas",
    totalFood: "Total de Comida",
    baratometer: "Baratômetro",
    vote: "Votar",
    admin: "Admin",
    delay: "Atraso",
    minutes: "minutos",
    broadcast: "Comunicado",
    callUber: "Chamar Uber",
    sosNei: "SOS Nei",
    map: "Mapa",
    completed: "Concluído",
    current: "Atual",
    upcoming: "Próximo",
  },
  en: {
    drink: "Drink",
    food: "Food",
    vibe: "Vibe", 
    service: "Service",
    atBar: "At Bar",
    inTransit: "In Transit",
    selectName: "Select your name",
    welcome: "Welcome to Baratona!",
    currentBar: "Current Bar",
    nextBar: "Next Bar",
    arrivalProjection: "Arrival Projection",
    totalDrinks: "Total Drinks",
    totalFood: "Total Food",
    baratometer: "Baratometer",
    vote: "Vote",
    admin: "Admin",
    delay: "Delay",
    minutes: "minutes",
    broadcast: "Broadcast",
    callUber: "Call Uber",
    sosNei: "SOS Nei",
    map: "Map",
    completed: "Completed",
    current: "Current",
    upcoming: "Upcoming",
  }
};

export type Language = 'pt' | 'en';
