import os
import re

# Mapping of MUI components to our local UI components
MAPPING = {
    'Box': '@/components/ui/box',
    'Stack': '@/components/ui/stack',
    'Typography': '@/components/ui/typography',
    'Button': '@/components/ui/button',
    'Container': '@/components/ui/container',
    'Grid': '@/components/ui/grid',
    'Chip': '@/components/ui/chip',
    'Divider': '@/components/ui/divider',
    'Avatar': '@/components/ui/avatar',
    'Checkbox': '@/components/ui/checkbox',
    'Table': '@/components/ui/table',
    'TableBody': '@/components/ui/table',
    'TableCell': '@/components/ui/table',
    'TableHead': '@/components/ui/table',
    'TableRow': '@/components/ui/table',
    'Paper': '@/components/ui/paper',
    'Modal': '@/components/ui/modal',
    'Popover': '@/components/ui/popover',
    'Pagination': '@/components/ui/pagination',
    'Skeleton': '@/components/ui/skeleton',
    'Select': '@/components/ui/select',
    'MenuItem': '@/components/ui/menu',
    'Menu': '@/components/ui/menu',
    'Switch': '@/components/ui/switch',
    'TextField': '@/components/ui/input',
    'Input': '@/components/ui/input',
    'CircularProgress': '@/components/ui/progress',
    'LinearProgress': '@/components/ui/progress',
    'FormControl': '@/components/ui/form-control',
    'InputLabel': '@/components/ui/form-control',
    'Alert': '@/components/ui/alert',
    'Card': '@/components/ui/card',
    'CardContent': '@/components/ui/card',
    'CardHeader': '@/components/ui/card',
    'CardActions': '@/components/ui/card',
    'IconButton': '@/components/ui/icon-button',
    'Dialog': '@/components/ui/modal',
    'DialogTitle': '@/components/ui/modal',
    'DialogContent': '@/components/ui/modal',
    'DialogActions': '@/components/ui/modal',
    'FormHelperText': '@/components/ui/input',
    'Grid2': '@/components/ui/grid',
    'InputAdornment': '@/components/ui/input',
    'List': '@/components/ui/list',
    'ListItem': '@/components/ui/list',
    'ListItemText': '@/components/ui/list',
    'ListItemIcon': '@/components/ui/list',
    'ListItemAvatar': '@/components/ui/list',
    'Stepper': '@/components/ui/stepper', # Will create this
    'Step': '@/components/ui/stepper',
    'StepLabel': '@/components/ui/stepper',
}

ICON_MAPPING = {
    'AccountBalance': 'MdAccountBalance',
    'Add': 'MdAdd',
    'ArrowBack': 'MdArrowBack',
    'ArrowForward': 'MdArrowForward',
    'Business': 'MdBusiness',
    'CheckCircle': 'MdCheckCircle',
    'Close': 'MdClose',
    'CloudUpload': 'MdCloudUpload',
    'Delete': 'MdDelete',
    'Description': 'MdDescription',
    'Handshake': 'MdHandshake',
    'People': 'MdPeople',
    'PlayArrow': 'MdPlayArrow',
    'Search': 'MdSearch',
    'Storefront': 'MdStorefront',
    'TrendingUp': 'MdTrendingUp',
    'VerifiedUser': 'MdVerifiedUser',
    'MoreVert': 'MdMoreVert',
    'Edit': 'MdEdit',
    'Visibility': 'MdVisibility',
    'VisibilityOff': 'MdVisibilityOff',
    'ExpandMore': 'MdExpandMore',
    'ExpandLess': 'MdExpandLess',
    'ChevronRight': 'MdChevronRight',
    'ChevronLeft': 'MdChevronLeft',
}

def migrate_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Replace named imports: import { Box, Stack } from '@mui/material'
    new_lines = []
    
    def replace_named_import(match):
        imports_str = match.group(1)
        imports = [i.strip() for i in imports_str.split(',')]
        for i in imports:
            if not i: continue
            if i in MAPPING:
                new_lines.append(f"import {{ {i} }} from '{MAPPING[i]}';")
            elif i in ICON_MAPPING:
                new_lines.append(f"import {{ {ICON_MAPPING[i]} as {i} }} from 'react-icons/md';")
            else:
                new_lines.append(f"// TODO: Migrate {i} from @mui/material")
        return "" # Remove the original line

    content = re.sub(r"import\s*\{\s*([^}]+)\s*\}\s*from\s*['\"]@mui/material['\"];?", replace_named_import, content)
    content = re.sub(r"import\s*\{\s*([^}]+)\s*\}\s*from\s*['\"]@mui/system['\"];?", replace_named_import, content)

    # 2. Replace default imports: import Box from '@mui/material/Box'
    for comp, path in MAPPING.items():
        pattern = rf"import\s+{comp}\s+from\s+['\"]@mui/material/{comp}['\"];?"
        if re.search(pattern, content):
            content = re.sub(pattern, "", content)
            new_lines.append(f"import {{ {comp} }} from '{path}';")
        
        pattern_system = rf"import\s+{comp}\s+from\s+['\"]@mui/system/{comp}['\"];?"
        if re.search(pattern_system, content):
            content = re.sub(pattern_system, "", content)
            new_lines.append(f"import {{ {comp} }} from '{path}';")

    # 3. Replace Icon imports: import AccountBalance from '@mui/icons-material/AccountBalance'
    for icon, react_icon in ICON_MAPPING.items():
        pattern = rf"import\s+{icon}\s+from\s+['\"]@mui/icons-material/{icon}['\"];?"
        if re.search(pattern, content):
            content = re.sub(pattern, "", content)
            new_lines.append(f"import {{ {react_icon} as {icon} }} from 'react-icons/md';")

    # 4. Remove any remaining mui imports that might have missed or were partially replaced
    content = re.sub(r"import\s+.*\s+from\s+['\"]@mui/icons-material/.*['\"];?", "", content)
    content = re.sub(r"import\s+.*\s+from\s+['\"]@mui/material/.*['\"];?", "", content)
    content = re.sub(r"import\s+.*\s+from\s+['\"]@mui/system/.*['\"];?", "", content)

    # 5. Add new imports at the top
    if new_lines:
        # Deduplicate new_lines
        unique_new_lines = sorted(list(set(new_lines)))
        
        insert_index = 0
        if content.startswith("'use client'"):
            insert_index = content.find('\n') + 1
        
        content = content[:insert_index] + '\n' + '\n'.join(unique_new_lines) + '\n' + content[insert_index:]

    # Final cleanup of double newlines
    content = re.sub(r'\n\n\n+', '\n\n', content)

    with open(filepath, 'w') as f:
        f.write(content)

def main():
    src_dir = '/Users/macbook/D_minmeg/MINMEG-frontend/customer-frontend-next/src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                migrate_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
