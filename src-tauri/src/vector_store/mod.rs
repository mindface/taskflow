use qdrant_client::{
    prelude::*,
    qdrant::{
        CreateCollection, Distance, VectorParams,
        SearchPoints, WithPayloadSelector, ScoredPoint,
    },
    Qdrant,
    config::QdrantConfig,
};
use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct VectorEntry {
    pub id: String,
    pub vector: Vec<f32>,
    pub payload: serde_json::Value,
}

pub struct VectorStore {
    client: QdrantClient,
    collection_name: String,
}

impl VectorStore {
    pub async fn new(collection_name: &str) -> Result<Self, Box<dyn Error>> {
        let config = QdrantClientConfig::from_url("http://localhost:6334");
        let client = QdrantClient::new(Some(config))?;
        
        // コレクションが存在しない場合は作成
        let collections = client.list_collections().await?;
        if !collections.collections.iter().any(|c| c.name == collection_name) {
            let vector_params = VectorParams {
                size: 384,
                distance: Distance::Cosine.into(),
                ..Default::default()
            };

            client.create_collection(&CreateCollection {
                collection_name: collection_name.to_string(),
                vectors_config: Some(vector_params.into()),
                ..Default::default()
            }).await?;
        }
        
        Ok(Self {
            client,
            collection_name: collection_name.to_string(),
        })
    }
    
    pub async fn store_vector(&self, entry: VectorEntry) -> Result<(), Box<dyn Error>> {
        let payload: Payload = serde_json::from_value(entry.payload)?;
        
        let points: Vec<_> = vec![PointStruct::new(
            entry.id,
            entry.vector,
            payload,
        )];
        
        self.client.upsert_points(
            &self.collection_name,
            None,
            points,
            None,
        ).await?;

        Ok(())
    }
    
    pub async fn search_similar(&self, vector: Vec<f32>, limit: u64) -> Result<Vec<ScoredPoint>, Box<dyn Error>> {
        let search_result = self.client.search_points(&SearchPoints {
            collection_name: self.collection_name.clone(),
            vector,
            limit,
            with_payload: Some(WithPayloadSelector::default()),
            ..Default::default()
        }).await?;
        
        Ok(search_result.result)
    }
} 