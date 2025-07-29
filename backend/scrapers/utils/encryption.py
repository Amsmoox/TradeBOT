"""
Secure encryption utilities for credential management
"""
import os
import base64
from cryptography.fernet import Fernet
from django.conf import settings

class SecureCredentialManager:
    """
    Handles secure encryption and decryption of sensitive credentials
    using Fernet symmetric encryption (AES 128 in CBC mode)
    """
    
    def __init__(self):
        self.key = self._get_or_create_key()
        self.cipher = Fernet(self.key)
    
    def _get_or_create_key(self):
        """Get encryption key from environment or generate a new one"""
        # In production, this should be stored securely (e.g., AWS KMS, HashiCorp Vault)
        key_env = os.environ.get('CREDENTIAL_ENCRYPTION_KEY')
        
        if key_env:
            try:
                # Validate the key format
                return base64.urlsafe_b64decode(key_env.encode())
            except Exception:
                pass
        
        # Generate a new key for development/testing
        key = Fernet.generate_key()
        
        # In development, we can print this key for reference
        if settings.DEBUG:
            print(f"Generated new encryption key: {base64.urlsafe_b64encode(key).decode()}")
            print("Set CREDENTIAL_ENCRYPTION_KEY environment variable to persist this key")
        
        return key
    
    def encrypt_credentials(self, credentials_dict):
        """
        Encrypt a dictionary of credentials
        
        Args:
            credentials_dict (dict): Dictionary containing credential key-value pairs
            
        Returns:
            str: Base64 encoded encrypted credentials
        """
        if not credentials_dict:
            return ""
        
        # Convert dict to JSON string and encrypt
        import json
        credentials_json = json.dumps(credentials_dict)
        encrypted_data = self.cipher.encrypt(credentials_json.encode())
        
        # Return base64 encoded for storage
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt_credentials(self, encrypted_credentials):
        """
        Decrypt encrypted credentials back to dictionary
        
        Args:
            encrypted_credentials (str): Base64 encoded encrypted credentials
            
        Returns:
            dict: Dictionary containing credential key-value pairs
        """
        if not encrypted_credentials:
            return {}
        
        try:
            # Decode from base64 and decrypt
            encrypted_data = base64.urlsafe_b64decode(encrypted_credentials.encode())
            decrypted_json = self.cipher.decrypt(encrypted_data).decode()
            
            # Parse JSON back to dict
            import json
            return json.loads(decrypted_json)
        except Exception as e:
            # Log error in production, return empty dict for graceful degradation
            if settings.DEBUG:
                print(f"Failed to decrypt credentials: {e}")
            return {}
    
    def mask_credentials(self, credentials_dict):
        """
        Create a masked version of credentials for safe display
        
        Args:
            credentials_dict (dict): Dictionary containing credentials
            
        Returns:
            dict: Dictionary with masked sensitive values
        """
        if not credentials_dict:
            return {}
        
        masked = {}
        sensitive_keys = {
            'password', 'token', 'secret', 'key', 'auth', 'api_key', 
            'bot_token', 'access_token', 'refresh_token', 'private_key'
        }
        
        for key, value in credentials_dict.items():
            key_lower = key.lower()
            
            # Check if this is a sensitive field
            is_sensitive = any(sensitive_word in key_lower for sensitive_word in sensitive_keys)
            
            if is_sensitive and value:
                # Mask the value while preserving some structure
                if len(str(value)) <= 4:
                    masked[key] = "*" * len(str(value))
                else:
                    visible_chars = 2
                    masked_chars = len(str(value)) - (visible_chars * 2)
                    masked[key] = f"{str(value)[:visible_chars]}{'*' * masked_chars}{str(value)[-visible_chars:]}"
            else:
                masked[key] = value
        
        return masked

# Global instance for use throughout the application
credential_manager = SecureCredentialManager()
