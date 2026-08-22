import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Add more Lucide icons to import
import_pattern = r"import \{ Search, Plus, Edit2, Trash2, Loader2, ChevronDown, FileText, X, Check, Bell, Award, Download, Share2 \} from 'lucide-react';"
import_replacement = "import { Search, Plus, Edit2, Trash2, Loader2, ChevronDown, FileText, X, Check, Bell, Award, Download, Share2, Flower, Wallet, Hammer, Coins, Map, Users } from 'lucide-react';"
content = re.sub(import_pattern, import_replacement, content)

# Inject icon helper function
helper = """  const getCategoryIcon = (name: string) => {
    if (name.includes('បុណ្យផ្កា')) return <Flower className="w-6 h-6 text-pink-500" />;
    if (name.includes('កណ្ដឹង')) return <Bell className="w-6 h-6 text-amber-500" />;
    if (name.includes('កម្រាលព្រំ')) return <Map className="w-6 h-6 text-purple-500" />;
    if (name.includes('លុយជាង')) return <Hammer className="w-6 h-6 text-orange-500" />;
    if (name.includes('ចងដៃ')) return <Coins className="w-6 h-6 text-emerald-500" />;
    return <FileText className="w-6 h-6 text-blue-500" />;
  };

  const getCategoryStatus = (name: string | undefined) => {"""
content = content.replace("  const getCategoryStatus = (name: string | undefined) => {", helper)

# Update the grid view to use the helper
icon_render_pattern = r"<FileText className=\"w-6 h-6 text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors\" \/>"
icon_render_replacement = "{getCategoryIcon(cat.name)}"
content = re.sub(icon_render_pattern, icon_render_replacement, content)

# Remove the group-hover background color override from the circle so the custom color shows better
circle_pattern = r"w-12 h-12 bg-gray-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-500\/10 rounded-full flex items-center justify-center mb-3 transition-colors"
circle_replacement = "w-12 h-12 bg-gray-50 dark:bg-slate-800 group-hover:bg-gray-100 dark:group-hover:bg-slate-700 rounded-full flex items-center justify-center mb-3 transition-colors"
content = re.sub(circle_pattern, circle_replacement, content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
