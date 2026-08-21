"""
K-Means Clustering Attraction Recommender Module
Implements Unsupervised ML using Scikit-Learn KMeans on 9-dimensional interest vectors.
Converts user interest selections into a feature vector, matches attraction clusters,
and generates contextual explainability tags for academic demonstration.
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from typing import List, Dict, Any

INTEREST_CATEGORIES = [
    "Nature",
    "Adventure",
    "Historical",
    "Beach",
    "Wildlife",
    "Culture",
    "Food",
    "Photography",
    "Family"
]

FEATURE_COLUMNS = [
    "nature_score",
    "adventure_score",
    "history_score",
    "beach_score",
    "wildlife_score",
    "culture_score",
    "food_score",
    "photography_score",
    "family_score"
]

class PlaceRecommenderKMeans:
    def __init__(self, n_clusters: int = 3):
        self.n_clusters = n_clusters
        self.kmeans = None

    def user_interests_to_vector(self, user_interests: List[str]) -> np.ndarray:
        """Converts user selected interest strings into a 9-dimensional binary/weighted vector."""
        vec = np.zeros(len(FEATURE_COLUMNS))
        user_lower = [i.lower().strip() for i in user_interests]

        mapping = {
            "nature": 0,
            "adventure": 1,
            "historical": 2,
            "history": 2,
            "beach": 3,
            "wildlife": 4,
            "culture": 5,
            "cultural": 5,
            "food": 6,
            "photography": 7,
            "family": 8
        }

        for interest in user_lower:
            if interest in mapping:
                vec[mapping[interest]] = 1.0

        # If user didn't select anything, assign uniform weight
        if np.sum(vec) == 0:
            vec = np.ones(len(FEATURE_COLUMNS)) * 0.5
        return vec

    def recommend(
        self,
        places_data: List[Dict[str, Any]],
        user_interests: List[str],
        limit: int = 6,
        time_of_day: str = "All",
        pacing: str = "Balanced"
    ) -> Dict[str, Any]:
        """
        Runs K-Means clustering over attraction feature vectors and ranks
        the places closest to user's interest preference vector, factoring in time of day and pacing.
        """
        if not places_data:
            return {
                "recommendations": [],
                "cluster_count": 0,
                "algorithm": "K-Means Clustering (Empty Dataset)"
            }

        df = pd.DataFrame(places_data)
        
        # Ensure all feature columns exist with numeric values
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0.0
            df[col] = df[col].fillna(0.0).astype(float)

        X = df[FEATURE_COLUMNS].values
        num_samples = len(X)
        actual_clusters = min(self.n_clusters, max(1, num_samples // 2))

        # Fit K-Means
        try:
            self.kmeans = KMeans(n_clusters=actual_clusters, random_state=42, n_init=10)
            cluster_labels = self.kmeans.fit_predict(X)
            df["cluster_id"] = cluster_labels
        except Exception:
            df["cluster_id"] = 0

        # Compute cosine similarity / weighted distance to user vector
        user_vec = self.user_interests_to_vector(user_interests)
        norm_u = np.linalg.norm(user_vec)
        
        scores = []
        for idx, row in df.iterrows():
            place_vec = row[FEATURE_COLUMNS].values.astype(float)
            norm_p = np.linalg.norm(place_vec)
            
            if norm_u > 0 and norm_p > 0:
                # Cosine similarity + popularity & rating boost
                sim = np.dot(user_vec, place_vec) / (norm_u * norm_p)
                rating_boost = (float(row.get("rating", 4.0)) / 5.0) * 0.15
                pop_boost = (float(row.get("popularity", 80.0)) / 100.0) * 0.10
                
                # Contextual Time of Day and Pacing modifiers
                time_boost = 0.0
                p_name_lower = str(row.get("name", "")).lower()
                p_cat_lower = str(row.get("category", "")).lower()

                if time_of_day.lower() == "morning" and any(k in p_cat_lower or k in p_name_lower for k in ["nature", "peak", "garden", "lake", "view"]):
                    time_boost += 0.08
                elif time_of_day.lower() in ["sunset", "evening"] and any(k in p_cat_lower or k in p_name_lower for k in ["lake", "view", "boat", "cafe", "market", "shopping"]):
                    time_boost += 0.08

                pacing_boost = 0.0
                est_hrs = float(row.get("estimated_visit_hours", 2.0))
                if pacing.lower() == "relaxed" and est_hrs >= 2.0:
                    pacing_boost += 0.05
                elif pacing.lower() == "intense" and est_hrs <= 1.5:
                    pacing_boost += 0.05

                final_score = float(sim * 0.70 + rating_boost + pop_boost + time_boost + pacing_boost)
            else:
                final_score = 0.5

            scores.append(final_score)

        df["match_score"] = scores
        df = df.sort_values(by=["match_score", "rating"], ascending=[False, False])

        # Generate explainability tags
        recommendations = []
        top_interests = user_interests if user_interests else ["Popular Sights"]
        reason_text = " + ".join(top_interests[:2])

        for _, row in df.head(limit).iterrows():
            place_dict = row.to_dict()
            # Find primary matching attributes
            matched_features = []
            for feat, col in zip(INTEREST_CATEGORIES, FEATURE_COLUMNS):
                if row[col] >= 0.7:
                    matched_features.append(feat)
            
            specific_reason = f"High match for {', '.join(matched_features[:2])}" if matched_features else f"Recommended because you selected: {reason_text}"
            if time_of_day.lower() != "all":
                specific_reason += f" • Ideal for {time_of_day.title()} Visit"

            recommendations.append({
                "place": place_dict,
                "match_score": round(min(99.5, float(row["match_score"]) * 100), 1),
                "cluster_id": int(row["cluster_id"]),
                "reason": specific_reason
            })

        return {
            "destination": places_data[0].get("destination_name", "Selected Destination") if places_data else "",
            "selected_interests": user_interests,
            "recommendations": recommendations,
            "cluster_count": actual_clusters,
            "algorithm": "K-Means Clustering (9D Feature Vector)"
        }

recommender_engine = PlaceRecommenderKMeans()
