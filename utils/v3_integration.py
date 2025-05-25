import requests
import platform
import uuid
import hashlib
import os
import json
import sys
from typing import Dict, Any, Optional, Tuple

class LicenseManager:
    def __init__(self, api_url: str):
        """
        Khởi tạo License Manager để tích hợp với hệ thống quản lý giấy phép.
        
        Args:
            api_url: URL của API quản lý giấy phép
        """
        self.api_url = api_url.rstrip('/')
        self.license_key = None
        self.license_status = None
        self.license_info = None
        self.config_file = os.path.join(os.path.expanduser("~"), ".v3_license.json")
        
        # Tải thông tin license từ file cấu hình nếu có
        self._load_config()
    
    def _get_hardware_id(self) -> str:
        """
        Lấy Hardware ID duy nhất của máy tính.
        Kết hợp nhiều thông số phần cứng để tạo ID duy nhất.
        
        Returns:
            str: Hardware ID đã được băm
        """
        # Lấy thông tin phần cứng
        system_info = platform.system()
        machine_info = platform.machine()
        processor_info = platform.processor()
        
        # Lấy MAC address của card mạng chính
        mac_address = uuid.getnode()
        
        # Lấy Volume ID (Windows) hoặc Disk ID (Linux/Mac)
        volume_id = ""
        if system_info == "Windows":
            try:
                import wmi
                c = wmi.WMI()
                for disk in c.Win32_LogicalDisk():
                    if disk.DeviceID == 'C:':
                        volume_id = disk.VolumeSerialNumber
                        break
            except:
                # Fallback nếu không lấy được Volume ID
                volume_id = str(os.getenv('SystemDrive', 'C:'))
        else:
            # Trên Linux/Mac, lấy UUID của ổ đĩa chính
            try:
                if os.path.exists('/etc/machine-id'):
                    with open('/etc/machine-id', 'r') as f:
                        volume_id = f.read().strip()
                elif os.path.exists('/var/lib/dbus/machine-id'):
                    with open('/var/lib/dbus/machine-id', 'r') as f:
                        volume_id = f.read().strip()
            except:
                # Fallback
                volume_id = str(os.getenv('HOME', ''))
        
        # Kết hợp tất cả thông tin
        hardware_str = f"{system_info}|{machine_info}|{processor_info}|{mac_address}|{volume_id}"
        
        # Băm thông tin để tạo HWID
        hwid = hashlib.sha256(hardware_str.encode()).hexdigest()
        
        return hwid
    
    def _load_config(self) -> None:
        """Tải thông tin license từ file cấu hình"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    self.license_key = config.get('license_key')
                    self.license_info = config.get('license_info')
                    self.license_status = config.get('license_status')
        except Exception as e:
            print(f"Lỗi khi tải cấu hình license: {e}")
    
    def _save_config(self) -> None:
        """Lưu thông tin license vào file cấu hình"""
        try:
            config = {
                'license_key': self.license_key,
                'license_info': self.license_info,
                'license_status': self.license_status
            }
            with open(self.config_file, 'w') as f:
                json.dump(config, f)
        except Exception as e:
            print(f"Lỗi khi lưu cấu hình license: {e}")
    
    def activate_license(self, license_key: str) -> Tuple[bool, str]:
        """
        Kích hoạt license với key được cung cấp.
        
        Args:
            license_key: Serial key cần kích hoạt
            
        Returns:
            Tuple[bool, str]: (Thành công hay không, Thông báo)
        """
        try:
            hwid = self._get_hardware_id()
            
            # Gọi API kích hoạt license
            response = requests.post(
                f"{self.api_url}/api/licenses/activate",
                json={
                    'key': license_key,
                    'hardwareId': hwid
                },
                timeout=10
            )
            
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                self.license_key = license_key
                self.license_status = "active"
                self._save_config()
                return True, "License đã được kích hoạt thành công"
            else:
                return False, data.get('error', 'Không thể kích hoạt license')
        
        except requests.RequestException as e:
            return False, f"Lỗi kết nối: {str(e)}"
        except Exception as e:
            return False, f"Lỗi không xác định: {str(e)}"
    
    def validate_license(self) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Kiểm tra tính hợp lệ của license hiện tại.
        
        Returns:
            Tuple[bool, str, Optional[Dict]]: (Hợp lệ hay không, Thông báo, Thông tin license nếu hợp lệ)
        """
        if not self.license_key:
            return False, "Chưa có license key", None
        
        try:
            hwid = self._get_hardware_id()
            
            # Gọi API kiểm tra license
            response = requests.post(
                f"{self.api_url}/api/licenses/validate",
                json={
                    'key': self.license_key,
                    'hardwareId': hwid
                },
                timeout=10
            )
            
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                self.license_info = data.get('data')
                self.license_status = "active"
                self._save_config()
                return True, "License hợp lệ", self.license_info
            else:
                self.license_status = "invalid"
                self._save_config()
                return False, data.get('message', 'License không hợp lệ'), None
        
        except requests.RequestException:
            # Nếu không kết nối được, kiểm tra thông tin đã lưu
            if self.license_status == "active" and self.license_info:
                # Cho phép sử dụng offline trong thời gian ngắn
                return True, "Sử dụng license offline (tạm thời)", self.license_info
            return False, "Không thể kết nối đến máy chủ xác thực", None
        except Exception as e:
            return False, f"Lỗi không xác định: {str(e)}", None
    
    def get_license_info(self) -> Optional[Dict[str, Any]]:
        """
        Lấy thông tin license hiện tại.
        
        Returns:
            Optional[Dict]: Thông tin license hoặc None nếu không có
        """
        return self.license_info
    
    def clear_license(self) -> None:
        """Xóa thông tin license hiện tại"""
        self.license_key = None
        self.license_info = None
        self.license_status = None
        
        # Xóa file cấu hình nếu có
        if os.path.exists(self.config_file):
            try:
                os.remove(self.config_file)
            except:
                pass
