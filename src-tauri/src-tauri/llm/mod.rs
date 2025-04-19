use ollama_rs::{
    Ollama,
    generation::completion::{request::GenerationRequest, GenerationResponse},
};
use rust_bert::pipelines::sentence_embeddings::{
    SentenceEmbeddingsBuilder,
    SentenceEmbeddingsModelType,
};
use std::error::Error;

pub struct LLMManager {
    ollama: Ollama,
    embedding_model_type: SentenceEmbeddingsModelType,
}

impl LLMManager {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            ollama: Ollama::default(),
            embedding_model_type: SentenceEmbeddingsModelType::AllMiniLmL6V2,
        })
    }
    
    pub async fn generate_response(&self, prompt: &str, context: &str) -> Result<String, Box<dyn Error>> {
        let full_prompt = format!("Context: {}\n\nQuestion: {}", context, prompt);
        
        let request = GenerationRequest::new("llama2".to_string(), full_prompt);
        let response = self.ollama.generate(request).await?;
        
        Ok(response.response)
    }
    
    pub fn get_embeddings(&self, text: &str) -> Result<Vec<f32>, Box<dyn Error>> {
        let model = SentenceEmbeddingsBuilder::remote(SentenceEmbeddingsModelType::AllMiniLmL6V2)
            .create_model()?;

        let embeddings = model.encode(&[text])?;
        Ok(embeddings[0].to_vec())
    }
    
    pub async fn update_model(&self, new_data: &str) -> Result<(), Box<dyn Error>> {
        // モデルの更新ロジック
        // ここではOllamaのモデル更新APIを使用
        Ok(())
    }
} 