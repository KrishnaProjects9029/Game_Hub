export interface QuizQuestion {
  id: number;
  question: string;
  category: string;
  options: string[];
  correctIndex: number;
}

export const QUIZ_DATABASE: QuizQuestion[] = [
  { id: 1, question: "Which planet is known as the Red Planet?", category: "Science", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1 },
  { id: 2, question: "What is the capital city of Japan?", category: "Geography", options: ["Kyoto", "Osaka", "Tokyo", "Hiroshima"], correctIndex: 2 },
  { id: 3, question: "In Minecraft, which ore is needed to brew potions?", category: "Gaming", options: ["Redstone", "Diamond", "Nether Wart", "Emerald"], correctIndex: 2 },
  { id: 4, question: "How many sides does a hexagon have?", category: "Math", options: ["5", "6", "7", "8"], correctIndex: 1 },
  { id: 5, question: "What is the largest mammal on Earth?", category: "Nature", options: ["African Elephant", "Blue Whale", "Giraffe", "Orca"], correctIndex: 1 },
  { id: 6, question: "What chemical symbol represents Gold?", category: "Science", options: ["Ag", "Au", "Fe", "Gd"], correctIndex: 1 },
  { id: 7, question: "Which video game character is known as the 'Blue Blur'?", category: "Gaming", options: ["Mega Man", "Sonic the Hedgehog", "Crash Bandicoot", "Pac-Man"], correctIndex: 1 },
  { id: 8, question: "Which ocean is the largest in the world?", category: "Geography", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
  { id: 9, question: "What gas do plants absorb from the atmosphere for photosynthesis?", category: "Science", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], correctIndex: 1 },
  { id: 10, question: "In chess, which piece can only move diagonally?", category: "Games", options: ["Rook", "Knight", "Bishop", "Pawn"], correctIndex: 2 },
  { id: 11, question: "What is the boiling point of water at standard sea level?", category: "Science", options: ["90°C", "100°C", "110°C", "120°C"], correctIndex: 1 },
  { id: 12, question: "Which country is home to the Kangaroo?", category: "Nature", options: ["New Zealand", "South Africa", "Australia", "Brazil"], correctIndex: 2 },
  { id: 13, question: "In Pokémon, which type is super effective against Water?", category: "Gaming", options: ["Fire", "Electric", "Rock", "Ground"], correctIndex: 1 },
  { id: 14, question: "What is the hardest natural mineral on Earth?", category: "Science", options: ["Quartz", "Topaz", "Ruby", "Diamond"], correctIndex: 3 },
  { id: 15, question: "How many colors are there in a traditional rainbow?", category: "Nature", options: ["6", "7", "8", "9"], correctIndex: 1 },
  { id: 16, question: "Which continent is the Sahara Desert located on?", category: "Geography", options: ["Asia", "South America", "Africa", "Australia"], correctIndex: 2 },
  { id: 17, question: "What company created the PlayStation console?", category: "Gaming", options: ["Nintendo", "Sega", "Sony", "Microsoft"], correctIndex: 2 },
  { id: 18, question: "What is the main language spoken in Brazil?", category: "Geography", options: ["Spanish", "Portuguese", "French", "English"], correctIndex: 1 },
  { id: 19, question: "How many players are on a soccer (football) team on the pitch?", category: "Sports", options: ["9", "10", "11", "12"], correctIndex: 2 },
  { id: 20, question: "What is the fastest land animal in the world?", category: "Nature", options: ["Cheetah", "Pronghorn", "Lion", "Falcon"], correctIndex: 0 },
  { id: 21, question: "Who painted the Mona Lisa?", category: "Art", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"], correctIndex: 2 },
  { id: 22, question: "Which planet is closest to the Sun?", category: "Science", options: ["Mercury", "Venus", "Earth", "Mars"], correctIndex: 0 },
  { id: 23, question: "In Among Us, what are the antagonistic players called?", category: "Gaming", options: ["Traitors", "Impostors", "Hunters", "Spies"], correctIndex: 1 },
  { id: 24, question: "What is the currency of the United Kingdom?", category: "Geography", options: ["Euro", "Dollar", "Pound Sterling", "Franc"], correctIndex: 2 },
  { id: 25, question: "What instrument has 88 black and white keys?", category: "Music", options: ["Accordion", "Organ", "Piano", "Harpsichord"], correctIndex: 2 },
  { id: 26, question: "What is the primary ingredient in guacamole?", category: "Food", options: ["Tomato", "Avocado", "Lime", "Pepper"], correctIndex: 1 },
  { id: 27, question: "How many rings are on the Olympic flag?", category: "Sports", options: ["4", "5", "6", "7"], correctIndex: 1 },
  { id: 28, question: "What force keeps our feet on the ground?", category: "Science", options: ["Magnetism", "Friction", "Gravity", "Inertia"], correctIndex: 2 },
  { id: 29, question: "In Super Mario, what item makes Mario grow bigger?", category: "Gaming", options: ["Fire Flower", "Super Mushroom", "Super Star", "Coin"], correctIndex: 1 },
  { id: 30, question: "What is the freezing point of water in Fahrenheit?", category: "Science", options: ["0°F", "32°F", "100°F", "212°F"], correctIndex: 1 },
  { id: 31, question: "Which ancient wonder of the world is still standing?", category: "History", options: ["Colossus of Rhodes", "Lighthouse of Alexandria", "Great Pyramid of Giza", "Hanging Gardens"], correctIndex: 2 },
  { id: 32, question: "What is the tallest mountain above sea level?", category: "Geography", options: ["K2", "Mount Everest", "Kilimanjaro", "Denali"], correctIndex: 1 },
  { id: 33, question: "How many legs does a spider typically have?", category: "Nature", options: ["6", "8", "10", "12"], correctIndex: 1 },
  { id: 34, question: "In Pac-Man, what color is the ghost named Blinky?", category: "Gaming", options: ["Pink", "Cyan", "Orange", "Red"], correctIndex: 3 },
  { id: 35, question: "What is the study of fossils called?", category: "Science", options: ["Archaeology", "Paleontology", "Geology", "Anthropology"], correctIndex: 1 },
];
