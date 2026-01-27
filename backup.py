import os
import shutil

# Klasörleri kopyalamak için
def backup_folders():
    source_folder = '/path/to/source/folder'
    destination_folder = '/path/to/destination/folder'
    shutil.copytree(source_folder, destination_folder)

# ...