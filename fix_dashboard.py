import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace the messy imports
pattern = r"import React.*?export default function Dashboard\(\) \{"
replacement = """import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/apiClient';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key, Trophy, ChevronDown, ChevronUp, Printer, Star } from 'lucide-react';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  seil_id: string;
}

interface SeilPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  previous_balance?: number;
}

interface TopDonor {
  name: string;
  total: number;
  details: {
    category_name: string;
    amount: number;
  }[];
}

export default function Dashboard() {"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

