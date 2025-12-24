"""
Unit tests for api_server.py - FastAPI endpoint tests.
Uses TestClient with mocked dependencies.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


# Set up environment before importing the app
import os
os.environ.setdefault("GOOGLE_API_KEY", "test-api-key")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("COGNITO_USER_POOL_ID", "us-east-1_test123")
os.environ.setdefault("COGNITO_CLIENT_ID", "test-client-id")


class TestHealthEndpoint:
    """Tests for /health endpoint."""
    
    def test_health_returns_200(self):
        """Test that health endpoint returns 200 status."""
        from api_server import app
        client = TestClient(app)
        
        response = client.get("/health")
        
        assert response.status_code == 200
    
    def test_health_returns_model_info(self):
        """Test that health endpoint returns model information."""
        from api_server import app
        client = TestClient(app)
        
        response = client.get("/health")
        data = response.json()
        
        assert "model" in data
        assert "version" in data
        assert "status" in data
    
    def test_health_returns_ok_status(self):
        """Test that health returns OK status."""
        from api_server import app
        client = TestClient(app)
        
        response = client.get("/health")
        data = response.json()
        
        assert data["status"] == "healthy"

    def test_verify_auth_requires_authorization(self):
        """Test that verify endpoint handles missing authorization."""
        from api_server import app
        client = TestClient(app)
        
        response = client.get("/auth/verify")
        
        assert response.status_code == 200
        assert response.json()["authenticated"] is False

    def test_chat_returns_response_for_valid_query(self):
        """Test that chat returns response for valid query."""
        from api_server import app
        
        mock_answer = "Here is some medical advice..."
        
        # Patching the new functions used in api_server.chat
        with patch("api_server.check_input_safety") as mock_safety, \
             patch("api_server.invoke_llm") as mock_llm, \
             patch("api_server.extract_treatment_steps") as mock_steps, \
             patch("api_server.detect_medical_topic") as mock_topic, \
             patch("api_server.generate_all_step_images") as mock_images:
            
            mock_safety.return_value = (True, "How to treat a headache?", None)
            mock_llm.return_value = mock_answer
            mock_steps.return_value = [{"step_number": "1", "title": "Step 1", "description": "Do this", "image_prompt": "prompt"}]
            mock_topic.return_value = "Health Topic"
            mock_images.return_value = [] # No images generated in this mock
            
            client = TestClient(app)
            response = client.post(
                "/chat",
                json={"query": "How to treat a headache?", "generate_images": False}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "answer" in data
            assert data["answer"] == mock_answer

    def test_chat_includes_original_query(self):
        """Test that response includes original query."""
        from api_server import app
        
        with patch("api_server.check_input_safety") as mock_safety, \
             patch("api_server.invoke_llm") as mock_llm, \
             patch("api_server.extract_treatment_steps") as mock_steps, \
             patch("api_server.detect_medical_topic") as mock_topic, \
             patch("api_server.generate_all_step_images") as mock_images:
            
            mock_safety.return_value = (True, "Test query", None)
            mock_llm.return_value = "Answer"
            mock_steps.return_value = []
            mock_topic.return_value = "Topic"
            mock_images.return_value = []

            client = TestClient(app)
            response = client.post(
                "/chat",
                json={"query": "Test query", "generate_images": False}
            )
            
            data = response.json()
            assert data["original_query"] == "Test query"

    def test_chat_saves_for_authenticated_user(self):
        """Test that chat is saved for authenticated users."""
        from api_server import app
        
        with patch("api_server.check_input_safety") as mock_safety, \
             patch("api_server.invoke_llm") as mock_llm, \
             patch("api_server.extract_treatment_steps") as mock_steps, \
             patch("api_server.detect_medical_topic") as mock_topic, \
             patch("api_server.generate_all_step_images") as mock_images, \
             patch("api_server.get_user_info") as mock_auth, \
             patch("api_server.save_chat") as mock_save:
            
            mock_safety.return_value = (True, "Test query", None)
            mock_llm.return_value = "Answer"
            mock_steps.return_value = []
            mock_topic.return_value = "Topic"
            mock_images.return_value = []
            mock_auth.return_value = {"user_id": "user-123", "email": "test@test.com"}
            mock_save.return_value = {"chat_id": "chat-123"}
            
            client = TestClient(app)
            response = client.post(
                "/chat",
                json={"query": "Test query", "generate_images": False},
                headers={"Authorization": "Bearer valid-token"}
            )
            
            assert response.status_code == 200
            mock_save.assert_called_once()

    def test_upload_url_requires_auth(self):
        """Test that upload URL requires authentication."""
        from api_server import app
        client = TestClient(app)
        
        response = client.post(
            "/upload-report",
            json={"filename": "test.pdf", "content_type": "application/pdf"}
        )
        
        assert response.status_code == 401

    def test_upload_url_validates_file_type(self):
        """Test that upload URL validates allowed file types."""
        from api_server import app
        
        with patch("api_server.get_user_info") as mock_auth:
            mock_auth.return_value = {"user_id": "user-123", "email": "test@test.com"}
            
            # Setup environment variable for reports bucket
            with patch.dict(os.environ, {"REPORTS_BUCKET": "test-bucket"}):
                client = TestClient(app)
                response = client.post(
                    "/upload-report",
                    json={"filename": "test.exe", "content_type": "application/x-executable"},
                    headers={"Authorization": "Bearer valid-token"}
                )
                
                # Should fail validation
                assert response.status_code in [400, 422]


class TestDeleteChatEndpoint:
    """Tests for DELETE /history/{chat_id} endpoint."""
    
    def test_delete_chat_requires_auth(self):
        """Test that delete chat requires authentication."""
        from api_server import app
        client = TestClient(app)
        
        response = client.delete("/history/chat-123")
        
        assert response.status_code == 401
    
    def test_delete_chat_deletes_for_owner(self):
        """Test that chat is deleted for authenticated owner."""
        from api_server import app
        
        with patch("api_server.get_user_info") as mock_auth:
            mock_auth.return_value = {"user_id": "user-123", "email": "test@test.com"}
            with patch("api_server.delete_chat") as mock_delete:
                mock_delete.return_value = True
                
                client = TestClient(app)
                response = client.delete(
                    "/history/chat-123",
                    headers={"Authorization": "Bearer valid-token"}
                )
                
                assert response.status_code == 200
                mock_delete.assert_called_once_with("user-123", "chat-123")
