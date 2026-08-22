import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

pattern = r"  const \[seils, setSeils\] = useState<SeilPeriod\[\]>\(\[\]\);\n  const \[isAmountVisible.*?setLoading\(false\);\n    }\n  };"
replacement = """  const [seils, setSeils] = useState<SeilPeriod[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [isAmountVisible, setIsAmountVisible] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [expandedDonorIndex, setExpandedDonorIndex] = useState<number | null>(null);

  const toggleDonorExpand = (index: number) => {
    setExpandedDonorIndex(expandedDonorIndex === index ? null : index);
  };

  const handleToggleVisibility = () => {
    if (isAmountVisible) {
      setIsAmountVisible(false);
    } else {
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === "wsd-app-v") {
      setIsAmountVisible(true);
      setShowPasswordModal(false);
    } else {
      setPasswordError('ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seilData, finData, donorsData] = await Promise.all([
        api.getSeilPeriods(),
        api.getFinancialRecords(''),
        api.getTopDonors()
      ]);
      setSeils(seilData);
      setFinancials(finData);
      setTopDonors(donorsData || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

