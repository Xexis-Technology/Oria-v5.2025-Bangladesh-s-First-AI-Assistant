 document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const suggestionBox = document.getElementById('suggestionBox');
    
    // Sample data with tags
const sampleData = [
    { text: "Chat with an AI Chef", tag: "Cooking" },
    { text: "Discover Tech Trends", tag: "Technology" },
    { text: "Plan a Workout Routine", tag: "Fitness" },
    { text: "Find DIY Project Ideas", tag: "DIY" },
    { text: "Explore Space Facts", tag: "Astronomy" },
    { text: "Learn a New Language", tag: "Education" },
    { text: "Get Financial Tips", tag: "Finance" },
    { text: "Find Travel Destinations", tag: "Travel" },
    { text: "Ask for Relationship Advice", tag: "Lifestyle" },
    { text: "Discover Trending Books", tag: "Books" },
    { text: "Learn AI Programming Basics", tag: "Technology" },
    { text: "Create a Meal Plan", tag: "Health" },
    { text: "Find Productivity Hacks", tag: "Self-Improvement" },
    { text: "Plan a Virtual Event", tag: "Events" },
    { text: "Get Home Gardening Tips", tag: "Gardening" },
    { text: "Ask About Climate Change", tag: "Environment" },
    { text: "Understand Cryptocurrency", tag: "Finance" },
    { text: "Explore Photography Tips", tag: "Photography" },
    { text: "Learn About Digital Art", tag: "Art" },
    { text: "Ask About Popular Music Genres", tag: "Music" },
    { text: "Find Tips for Pet Care", tag: "Pets" },
    { text: "Get Quick Cooking Recipes", tag: "Cooking" },
    { text: "Ask About Latest Gadgets", tag: "Technology" },
    { text: "Explore Historical Events", tag: "History" },
    { text: "Get Stress Management Tips", tag: "Mental Health" },
    { text: "Plan an Outdoor Adventure", tag: "Travel" },
    { text: "Ask About Sports Updates", tag: "Sports" },
    { text: "Find Home Decor Ideas", tag: "Home" },
    { text: "Learn About Famous Artists", tag: "Art" },
    { text: "Get Makeup Tips", tag: "Beauty" },
    { text: "Explore Mindfulness Practices", tag: "Wellness" },
    { text: "Ask About Diet Trends", tag: "Health" },
    { text: "Discover Crafting Ideas", tag: "DIY" },
    { text: "Learn About Coding Languages", tag: "Technology" },
    { text: "Plan a Movie Marathon", tag: "Entertainment" },
    { text: "Explore Festival Traditions", tag: "Culture" },
    { text: "Get Freelancing Tips", tag: "Work" },
    { text: "Ask About Parenting Advice", tag: "Family" },
    { text: "Learn Meditation Techniques", tag: "Wellness" },
    { text: "Find Affordable Travel Tips", tag: "Travel" },
    { text: "Explore Famous Landmarks", tag: "History" },
    { text: "Ask About Healthy Snacks", tag: "Cooking" },
    { text: "Discover Programming Challenges", tag: "Technology" },
    { text: "Plan a Sustainable Lifestyle", tag: "Environment" },
    { text: "Explore Popular TV Shows", tag: "Entertainment" },
    { text: "Find Unique Gift Ideas", tag: "Shopping" },
    { text: "Get Study Tips", tag: "Education" },
    { text: "Ask About Famous Inventors", tag: "Science" },
    { text: "Learn About Mythological Stories", tag: "Culture" },
    { text: "Explore Minimalist Living Tips", tag: "Lifestyle" },
    { text: "Find Skin Care Routines", tag: "Beauty" },
    { text: "Discover Natural Remedies", tag: "Health" },
    { text: "Get Yoga Poses for Beginners", tag: "Fitness" },
    { text: "Plan a Weekend Getaway", tag: "Travel" },
    { text: "Explore Fun Science Experiments", tag: "Education" },
    { text: "Learn About AI Innovations", tag: "Technology" },
    { text: "Ask About Comic Book Heroes", tag: "Entertainment" },
    { text: "Discover Vintage Fashion Tips", tag: "Fashion" },
    { text: "Find Easy Home Fixes", tag: "DIY" },
    { text: "Plan a Charity Event", tag: "Social" },
    { text: "Get Career Growth Advice", tag: "Work" },
    { text: "Ask About Online Shopping Tips", tag: "Shopping" },
    { text: "Learn How to Write a Blog", tag: "Content Creation" },
    { text: "Discover Popular Dance Styles", tag: "Art" },
    { text: "Explore Eco-Friendly Products", tag: "Environment" },
    { text: "Get Tips on Networking Events", tag: "Work" },
    { text: "Find Out About Hidden Travel Gems", tag: "Travel" },
    { text: "Plan a Family Gathering", tag: "Family" },
    { text: "Ask About Iconic Films", tag: "Entertainment" },
    { text: "Explore Exotic Cuisines", tag: "Cooking" },
    { text: "Learn About Historical Architecture", tag: "History" },
    { text: "Find Tips for Managing Time", tag: "Self-Improvement" },
    { text: "Discover Gaming Strategies", tag: "Gaming" },
    { text: "Ask About Seasonal Fashion", tag: "Fashion" },
    { text: "Plan a Digital Detox", tag: "Wellness" },
    { text: "Find Adventure Sports Tips", tag: "Sports" },
    { text: "Learn About Renewable Energy", tag: "Environment" },
    { text: "Explore Ancient Civilizations", tag: "History" },
    { text: "Ask About Iconic Music Festivals", tag: "Music" },
    { text: "Discover Financial Budgeting Tools", tag: "Finance" },
    { text: "Learn About Astronomy Events", tag: "Astronomy" },
    { text: "Find Motivation for Projects", tag: "Self-Improvement" },
    { text: "Explore the Best Beach Destinations", tag: "Travel" },
    { text: "Ask About Cryptocurrency Trends", tag: "Finance" },
    { text: "Plan a Relaxing Spa Day", tag: "Wellness" },
    { text: "Find Tips for Managing Stress", tag: "Mental Health" },
    { text: "Learn About Influential Leaders", tag: "History" },
    { text: "Discover Secrets of Storytelling", tag: "Art" },
    { text: "Ask About Best Coffee Blends", tag: "Food" },
    { text: "Explore Unique Hobbies", tag: "Lifestyle" },
	
	{ text: "who's your originator", tag: "Oria" },
    { text: "who engineered you", tag: "About O." },
    { text: "who is your creator", tag: "About O." },
    { text: "About you", tag: "About O." },
    { text: "can you make an image", tag: "C.bailey" },
    { text: "Could you make a sketch?", tag: "C.bailey" },
    { text: "create a picture", tag: "C.bailey" },
    { text: "what company made you", tag: "About O." }
];


    searchInput.addEventListener('input', function(e) {
        const inputValue = e.target.value.toLowerCase();
        
        if(inputValue.length === 0) {
            suggestionBox.style.display = 'none';
            return;
        }

        const filteredSuggestions = sampleData.filter(item => 
            item.text.toLowerCase().includes(inputValue)
        );

        if(filteredSuggestions.length > 0) {
            displaySuggestions(filteredSuggestions, inputValue);
            suggestionBox.style.display = 'block';
        } else {
            suggestionBox.style.display = 'none';
        }
    });

    function displaySuggestions(suggestions, inputValue) {
        suggestionBox.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            // Create container for suggestion text
            const textSpan = document.createElement('span');
            const regex = new RegExp(`(${inputValue})`, 'gi');
            const highlightedText = suggestion.text.replace(regex, '<span class="highlight">$1</span>');
            textSpan.innerHTML = highlightedText;
            
            // Create tag element
            const tagSpan = document.createElement('span');
            tagSpan.className = 'suggestion-tag';
            tagSpan.textContent = suggestion.tag;
            
            // Append elements
            div.appendChild(textSpan);
            div.appendChild(tagSpan);
            
            div.addEventListener('click', () => {
                searchInput.value = suggestion.text;
                suggestionBox.style.display = 'none';
            });
            
            suggestionBox.appendChild(div);
        });
    }

    document.addEventListener('click', function(e) {
        if(!searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.style.display = 'none';
        }
    });
});
