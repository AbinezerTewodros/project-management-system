import React from 'react';
import { motion } from 'framer-motion';
import AttachmentUploader, { AttachmentItem } from '../../components/AttachmentUploader';

type RequestModel = {
  // Core Identification Fields
  requestId: string;
  referenceNo?: string;
  title: string;
  description?: string;
  
  // Requestor & Origin Details
  requestedBy: string;
  requestedByName?: string;
  businessSector?: string;
  businessDivision?: string;
  businessDepartment?: string;
  organizationName?: string;
  primaryContactEmail?: string;
  secondaryContactEmail?: string;
  primaryContactPhone?: string;
  secondaryContactPhone?: string;
  
  // Classification & Metadata
  requestType?: string;
  requestCategory?: string;
  serviceCategory?: string;
  productCategory?: string;
  priorityLevel?: string;
  businessImpact?: string;
  requestUrgency?: string;
  strategicAlignment?: string;
  estimatedCost?: number;
  estimatedBenefit?: number;
  benefitCaptureDuration?: number;
  requestedDeliveryDate?: string;
  riskLevel?: string;
  complexityLevel?: string;
  
  // Workflow & Status Tracking
  status?: string;
  workflowStage?: string;
  assignedTeam?: string;
  assignedTo?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
  lastUpdatedBy?: string;
  approvalDate?: string;
  requestDurationDays?: number;
  
  // Attachments
  attachmentList?: AttachmentItem[];
};

const REQUEST_TYPES = [
  'New Development',
  'Enhancement', 
  'Internal-Integration',
  'Third-Party Integration'
];

const REQUEST_CATEGORIES = [
  'Remittance',
  'Government',
  'Inhouse-development'
];

const SERVICE_CATEGORIES = [
  'Digital Banking Management',
  'Card Banking Management', 
  'Credit Management',
  'Risk Management'
];

const PRODUCT_CATEGORIES = [
  'Mobile Banking',
  'CBE Birr Wallet',
  'T24 Core Banking',
  'IMAL Core Banking',
  'Other Legacy System'
];

const PRIORITY_LEVELS = ['P1', 'P2', 'P3', 'P4', 'P5'];
const IMPACT_LEVELS = ['High', 'Medium', 'Low'];
const URGENCY_LEVELS = ['High', 'Medium', 'Low'];
const RISK_LEVELS = ['Low', 'Medium', 'High'];
const COMPLEXITY_LEVELS = ['Low', 'Medium', 'High'];

const defaultOrg = 'Commercial Bank of Ethiopia';

const pad2 = (n: number) => n.toString().padStart(2, '0');

const generateRequestId = () => {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = pad2(now.getMonth() + 1);
  const DD = pad2(now.getDate());
  const seq = pad2(Math.floor(Math.random() * 99) + 1);
  return `PR${YYYY}${MM}${DD}${seq}`;
};

const SCREENS = {
  SUMMARY: 'summary',
  CLASSIFICATION: 'classification',
  METADATA: 'metadata',
  REQUESTOR_DETAILS: 'requestor_details',
  ATTACHMENTS: 'attachments',
  REVIEW: 'review'
};

const RequestForm: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
  const [currentScreen, setCurrentScreen] = React.useState(SCREENS.SUMMARY);
  const [form, setForm] = React.useState<RequestModel>({
    requestId: generateRequestId(),
    title: '',
    requestedBy: '',
    requestedByName: '',
    organizationName: defaultOrg,
    status: 'Submitted',
    createdDate: new Date().toISOString()
  });
  const [attachmentList, setAttachmentList] = React.useState<AttachmentItem[]>([]);
  const [submitted, setSubmitted] = React.useState<RequestModel | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(new Set());
  // Track the selected option for Strategic Alignment separately so we can
  // show the 'Other' free-text input only when the user explicitly picks Other.
  const [alignmentSelectOption, setAlignmentSelectOption] = React.useState<string>('');

  const onChange = (k: keyof RequestModel, v: any) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  // (We no longer auto-compute completed steps from form values.)

  // cache screens array
  const screensArray = React.useMemo(() => Object.values(SCREENS), []);

  // We mark steps completed only when user clicks Continue and validation passes.
  // number of sequentially completed steps from the start (0..n) — computed from completedSteps
  const numberSequentiallyCompleted = React.useMemo(() => {
    for (let i = 0; i < screensArray.length; i++) {
      if (!completedSteps.has(screensArray[i])) return i;
    }
    return screensArray.length;
  }, [completedSteps, screensArray]);

  // first incomplete index (used to prevent skipping ahead)
  const firstIncompleteIndex = Math.min(screensArray.length - 1, Math.max(0, numberSequentiallyCompleted));

  const validateScreen = (screen: string): boolean => {
    const errs: Record<string, string> = {};
    
    switch (screen) {
      case SCREENS.SUMMARY:
        if (!form.title) errs.title = 'Request title is required';
        if (!form.description) errs.description = 'Request description is required';
        break;
      case SCREENS.CLASSIFICATION:
        if (!form.requestType) errs.requestType = 'Request type is required';
        if (!form.requestCategory) errs.requestCategory = 'Request category is required';
        if (!form.serviceCategory) errs.serviceCategory = 'Service category is required';
        if (!form.productCategory) errs.productCategory = 'Product category is required';
        if (!form.priorityLevel) errs.priorityLevel = 'Priority level is required';
        if (!form.businessImpact) errs.businessImpact = 'Business impact is required';
        if (!form.requestUrgency) errs.requestUrgency = 'Request urgency is required';
        break;
      case SCREENS.METADATA:
        if (!form.strategicAlignment) errs.strategicAlignment = 'Strategic alignment is required';
        break;
      case SCREENS.ATTACHMENTS:
        // require at least one attachment before continuing from Attachments step
        if (!attachmentList || attachmentList.length === 0) {
          errs.attachments = 'Please upload at least one supporting document to continue';
        }
        break;
      case SCREENS.REQUESTOR_DETAILS:
        if (!form.requestedBy) errs.requestedBy = 'Requested By (AD user ID) is required';
        if (!form.requestedByName) errs.requestedByName = 'Requested By Name is required';
        if (!form.businessSector) errs.businessSector = 'Business Sector is required';
        if (!form.businessDivision) errs.businessDivision = 'Business Division is required';
        if (!form.businessDepartment) errs.businessDepartment = 'Business Department is required';
        if (!form.primaryContactEmail) errs.primaryContactEmail = 'Primary contact email is required';
        if (!form.secondaryContactEmail) errs.secondaryContactEmail = 'Secondary contact email is required';
        if (!form.primaryContactPhone) errs.primaryContactPhone = 'Primary contact phone is required';
        if (!form.secondaryContactPhone) errs.secondaryContactPhone = 'Secondary contact phone is required';
        break;
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextScreen = () => {
    if (!validateScreen(currentScreen)) return;

    // mark the current step as completed when user successfully continues
    setCompletedSteps((prev) => new Set(prev).add(currentScreen));

    const screens = screensArray;
    const currentIndex = screens.indexOf(currentScreen);
    if (currentIndex < screens.length - 1) {
      setCurrentScreen(screens[currentIndex + 1]);
    }
  };

  const prevScreen = () => {
    const screens = screensArray;
    const currentIndex = screens.indexOf(currentScreen);
    if (currentIndex > 0) {
      setCurrentScreen(screens[currentIndex - 1]);
    }
  };

  const handleStepClick = (screen: string) => {
    // Use sequential completion to prevent skipping: only allow up to firstIncompleteIndex
    const screens = screensArray;
    const targetIndex = screens.indexOf(screen);
    const currentIndex = screens.indexOf(currentScreen);

    // allow navigating back or to current
    if (targetIndex <= currentIndex) {
      setCurrentScreen(screen);
      return;
    }

    // if trying to jump ahead beyond the first incomplete step, go to first incomplete
    if (targetIndex > firstIncompleteIndex) {
      setCurrentScreen(screens[firstIncompleteIndex]);
      return;
    }

    // allowed (all previous steps are completed)
    setCurrentScreen(screen);
  };

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateScreen(currentScreen)) return;
    
    const payload: RequestModel = { 
      ...form, 
      attachmentList,
      lastUpdatedDate: new Date().toISOString()
    };
    setSubmitted(payload);
    
    setForm({
      requestId: generateRequestId(),
      title: '',
      description: '',
      requestedBy: '',
      requestedByName: '',
      organizationName: defaultOrg,
      status: 'Submitted',
      createdDate: new Date().toISOString()
    });
    setAttachmentList([]);
    setCompletedSteps(new Set());
    setCurrentScreen(SCREENS.SUMMARY);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.SUMMARY:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Request Summary</h3>
              <p className="text-gray-600 mt-2">Provide the basic information about your request</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Request ID *</label>
                  <div className="p-3 rounded-lg border border-gray-300 bg-gray-50">
                    <span className="font-mono text-gray-700 font-bold">{form.requestId}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Automatically generated request identifier</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reference No</label>
                  <input 
                    value={form.referenceNo || ''} 
                    onChange={(e) => onChange('referenceNo', e.target.value)} 
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    placeholder="e.g., BR-DVS-012345"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Request Title *</label>
                  <input 
                    value={form.title} 
                    onChange={(e) => onChange('title', e.target.value)} 
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    placeholder="Brief, descriptive title of the request"
                  />
                  {errors.title && <div className="text-xs text-red-500 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.title}
                  </div>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Request Description *</label>
              <textarea 
                value={form.description || ''} 
                onChange={(e) => onChange('description', e.target.value)} 
                rows={4} 
                className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 resize-none"
                placeholder="Detailed description of the idea or request..."
              />
              {errors.description && <div className="text-xs text-red-500 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.description}
              </div>}
            </div>
          </motion.div>
        );

      case SCREENS.CLASSIFICATION:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Classification & Categorization</h3>
              <p className="text-gray-600 mt-2">Categorize your request for proper processing</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Request Type *', key: 'requestType', options: REQUEST_TYPES, error: errors.requestType },
                { label: 'Request Category *', key: 'requestCategory', options: REQUEST_CATEGORIES, error: errors.requestCategory },
                { label: 'Service Category *', key: 'serviceCategory', options: SERVICE_CATEGORIES, error: errors.serviceCategory },
                { label: 'Product Category *', key: 'productCategory', options: PRODUCT_CATEGORIES, error: errors.productCategory },
                { label: 'Business Impact *', key: 'businessImpact', options: IMPACT_LEVELS, error: errors.businessImpact },
                { label: 'Request Urgency *', key: 'requestUrgency', options: URGENCY_LEVELS, error: errors.requestUrgency },
                { label: 'Priority Level *', key: 'priorityLevel', options: PRIORITY_LEVELS, error: errors.priorityLevel },
              ].map(({ label, key, options, error }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <select 
                    value={(form as any)[key] || ''} 
                    onChange={(e) => onChange(key as keyof RequestModel, e.target.value)} 
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="">Select {label.replace(' *', '')}</option>
                    {options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {error && <div className="text-xs text-red-500 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>}
                </div>
              ))}
            </div>
          </motion.div>
        );

      case SCREENS.METADATA:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Additional Metadata</h3>
              <p className="text-gray-600 mt-2">Provide strategic and financial details</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Strategic Alignment *</label>
                {/* Allow selecting predefined alignment types or 'Other' to enter a custom value. */}
                <div className="flex gap-3 items-start">
                  <select
                    value={alignmentSelectOption}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAlignmentSelectOption(v);
                      // If user selects 'Other', clear stored strategicAlignment so they can type custom value below
                      if (v === 'Other') {
                        onChange('strategicAlignment', '');
                      } else {
                        onChange('strategicAlignment', v);
                      }
                    }}
                    className="p-3 rounded-lg border border-gray-300 transition-all duration-200 bg-white"
                  >
                    <option value="">Select alignment</option>
                    <option value="Strategic Pillars">Strategic Pillars</option>
                    <option value="Corporate Objective">Corporate Objective</option>
                    <option value="Sector">Sector</option>
                    <option value="Division">Division</option>
                    <option value="Other">Other</option>
                  </select>

                  {/* show free-text input only when the user explicitly selected 'Other' */}
                  {(alignmentSelectOption === 'Other') && (
                    <input
                      placeholder="Specify alignment (if Other)"
                      value={form.strategicAlignment || ''}
                      onChange={(e) => onChange('strategicAlignment', e.target.value)}
                      className="flex-1 p-3 rounded-lg border border-gray-300  transition-all duration-200"
                    />
                  )}
                </div>
                {errors.strategicAlignment && <div className="text-xs text-red-500 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.strategicAlignment}
                </div>}
              </div>

              {[
                { label: 'Estimated Cost (ETB)', key: 'estimatedCost', type: 'number', placeholder: 'Rough cost estimate in ETB' },
                { label: 'Estimated Benefit (ETB)', key: 'estimatedBenefit', type: 'number', placeholder: 'Business value or ROI' },
                { label: 'Benefit Capture Duration (months)', key: 'benefitCaptureDuration', type: 'number', placeholder: 'Duration in months' },
                { label: 'Requested Delivery Date', key: 'requestedDeliveryDate', type: 'date' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input 
                    type={type}
                    value={(form as any)[key] || ''} 
                    onChange={(e) => onChange(key as keyof RequestModel, type === 'number' ? parseFloat(e.target.value) || undefined : e.target.value)} 
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    placeholder={placeholder}
                  />
                </div>
              ))}

              {[
                { label: 'Risk Level', key: 'riskLevel', options: RISK_LEVELS },
                { label: 'Complexity Level', key: 'complexityLevel', options: COMPLEXITY_LEVELS },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <select 
                    value={(form as any)[key] || ''} 
                    onChange={(e) => onChange(key as keyof RequestModel, e.target.value)} 
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="">Select {label}</option>
                    {options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case SCREENS.REQUESTOR_DETAILS:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Requestor Details</h3>
              <p className="text-gray-600 mt-2">Provide your contact and organizational information</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Requested By (AD User ID) *', key: 'requestedBy', placeholder: 'e.g., anwarindris', error: errors.requestedBy },
                { label: 'Requested By Name *', key: 'requestedByName', placeholder: 'e.g., Anwar Indris', error: errors.requestedByName },
                { label: 'Business Sector *', key: 'businessSector', error: errors.businessSector },
                { label: 'Business Division *', key: 'businessDivision', error: errors.businessDivision },
                { label: 'Business Department *', key: 'businessDepartment', error: errors.businessDepartment },
                { label: 'Organization Name *', key: 'organizationName' },
                { label: 'Primary Contact Email *', key: 'primaryContactEmail', type: 'email', placeholder: 'e.g., anwarindris@cbe.com.et', error: errors.primaryContactEmail },
                { label: 'Secondary Contact Email *', key: 'secondaryContactEmail', type: 'email', error: errors.secondaryContactEmail },
                { label: 'Primary Contact Phone *', key: 'primaryContactPhone', placeholder: 'e.g., +251-911-098765', error: errors.primaryContactPhone },
                { label: 'Secondary Contact Phone *', key: 'secondaryContactPhone', error: errors.secondaryContactPhone },
              ].map(({ label, key, type, placeholder, error }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input 
                    type={type || 'text'}
                    value={(form as any)[key] || ''} 
                    onChange={(e) => onChange(key as keyof RequestModel, e.target.value)} 
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    placeholder={placeholder}
                  />
                  {error && <div className="text-xs text-red-500 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>}
                </div>
              ))}
            </div>
          </motion.div>
        );

      case SCREENS.ATTACHMENTS:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Attachments & Documents</h3>
              <p className="text-gray-600 mt-2">Upload supporting documents for your request</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <p className="text-sm text-gray-700 mb-4">
                Upload supporting documents such as Business Case, Cost Estimates, Business Requirement Document, 
                Business Feasibility Report, Technical Feasibility Report, UAT Test Report, INSA Security Certificate, 
                Security Clearance, Request Memo, Resource Assignment Memo.
              </p>
              
              <AttachmentUploader 
                darkMode={darkMode} 
                attachmentList={attachmentList} 
                setAttachmentList={setAttachmentList} 
                uploadedBy={form.requestedBy || 'system'} 
              />
              {errors.attachments && (
                <div className="text-sm text-red-500 mt-3">{errors.attachments}</div>
              )}
            </div>
          </motion.div>
        );

      case SCREENS.REVIEW:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Review & Submit</h3>
              <p className="text-gray-600 mt-2">Verify all information before submission</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="md:col-span-2 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Core Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><strong className="text-gray-700">Request ID:</strong> <span className="text-gray-700 font-mono">{form.requestId}</span></div>
                  <div><strong className="text-gray-700">Reference No:</strong> {form.referenceNo || '—'}</div>
                  <div className="md:col-span-2"><strong className="text-gray-700">Title:</strong> {form.title}</div>
                  <div className="md:col-span-2"><strong className="text-gray-700">Description:</strong> {form.description || '—'}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  Classification
                </h4>
                <div className="space-y-2">
                  <div><strong className="text-gray-700">Type:</strong> {form.requestType || '—'}</div>
                  <div><strong className="text-gray-700">Category:</strong> {form.requestCategory || '—'}</div>
                  <div><strong className="text-gray-700">Service:</strong> {form.serviceCategory || '—'}</div>
                  <div><strong className="text-gray-700">Product:</strong> {form.productCategory || '—'}</div>
                  <div><strong className="text-gray-700">Priority:</strong> {form.priorityLevel || '—'}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  Requestor Details
                </h4>
                <div className="space-y-2">
                  <div><strong className="text-gray-700">Requested By:</strong> {form.requestedBy}</div>
                  <div><strong className="text-gray-700">Organization:</strong> {form.organizationName}</div>
                  <div><strong className="text-gray-700">Primary Email:</strong> {form.primaryContactEmail}</div>
                  <div><strong className="text-gray-700">Attachments:</strong> {attachmentList.length} files</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-gray-700 font-medium">
                    Please review all provided information before submission. 
                    Once submitted, your request will be processed and you will be notified via email.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getScreenTitle = (screen: string) => {
    const titles = {
      [SCREENS.SUMMARY]: 'Summary',
      [SCREENS.CLASSIFICATION]: 'Classification',
      [SCREENS.METADATA]: 'Metadata',
      [SCREENS.REQUESTOR_DETAILS]: 'Requestor',
      [SCREENS.ATTACHMENTS]: 'Attachments',
      [SCREENS.REVIEW]: 'Review'
    };
    return titles[screen] || 'Request Form';
  };

  const getScreenIcon = (screen: string) => {
    const icons = {
      [SCREENS.SUMMARY]: '1',
      [SCREENS.CLASSIFICATION]: '2',
      [SCREENS.METADATA]: '3',
      [SCREENS.REQUESTOR_DETAILS]: '4',
      [SCREENS.ATTACHMENTS]: '5',
      [SCREENS.REVIEW]: '6'
    };
    return icons[screen] || '●';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-fuchsia-800 bg-clip-text text-transparent">
                   Idea Intake
                </h1>
                <p className="text-gray-600 text-sm">Submit a new project or idea request</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold bg-gradient-to-r from-purple-800 to-fuchsia-800 bg-clip-text text-transparent">
                Commercial Bank of Ethiopia
              </div>
              <div className="text-sm font-semibold bg-gradient-to-r from-purple-800 to-fuchsia-800 bg-clip-text text-transparent">
                Digital Factory
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Dribbble-style Progress Indicator */}
          <div className="px-8 py-8 bg-white">
            <div className="relative">
              {/* Main connecting line - starts/ends outside the step circles so it doesn't run under them */}
              <div className="absolute top-4 left-10 right-10 h-1 bg-gray-200 -translate-y-1/2 -z-10 rounded-full">
                {/* Progress fill - animated purple gradient */}
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: `${(numberSequentiallyCompleted / (screensArray.length - 1)) * 100}%` 
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              <div className="flex justify-between relative z-10">
                {screensArray.map((screen, index) => {
                  const isActive = currentScreen === screen;
                  const isCompleted = completedSteps.has(screen);
                  const screenIndex = index;
                  const isClickable = screenIndex <= firstIncompleteIndex || screenIndex <= screensArray.indexOf(currentScreen);
                  const isFutureStep = index > numberSequentiallyCompleted;

                  return (
                    <div key={screen} className="flex flex-col items-center flex-1 relative mt-3">
                      {/* per-step connectors removed — single track above covers progress, and it now starts/ends outside circles */}

                      {/* Step circle with gradient colors */}
                      <button
                        onClick={() => isClickable && handleStepClick(screen)}
                        disabled={!isClickable}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 relative ${
                          isClickable ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'
                        } ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg' 
                            : isActive 
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg ring-4 ring-purple-100'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        } ${isFutureStep ? 'opacity-60' : 'opacity-100'}`}
                        // ensure step circles render above the track
                        style={{ zIndex: 20 }}
                      >
                        {/* Checkmark for completed steps */}
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className={`text-sm font-bold ${
                            isActive ? 'text-white' : 'text-gray-500'
                          }`}>
                            {getScreenIcon(screen)}
                          </span>
                        )}
                        
                        {/* Active step indicator dot */}
                        {isActive && !isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 w-2 h-2 bg-purple-600 rounded-full ring-2 ring-white"
                          />
                        )}
                      </button>

                      {/* Step label */}
                      <button
                        onClick={() => isClickable && handleStepClick(screen)}
                        disabled={!isClickable}
                        className={`mt-3 text-xs font-medium transition-colors duration-200 px-2 py-1 rounded ${
                          isActive ? 'text-purple-700 font-semibold' : 
                          isCompleted ? 'text-gray-800' : 'text-gray-500'
                        } ${isClickable ? 'cursor-pointer hover:text-purple-600' : 'cursor-not-allowed opacity-60'}`}
                      >
                        {getScreenTitle(screen)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form content with side padding - constrained inner width to prevent fields growing with card */}
          <div className="px-8 pb-8">
            <div className="max-w-4xl mx-auto px-4 lg:px-8">
            <form onSubmit={onSubmit}>
              {renderScreen()}

              {/* Navigation buttons */}
              <div className="mt-12 flex justify-between items-center pt-8 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={prevScreen}
                  disabled={currentScreen === SCREENS.SUMMARY}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                    currentScreen === SCREENS.SUMMARY 
                      ? 'opacity-50 cursor-not-allowed text-gray-400' 
                      : 'text-purple-700 hover:text-purple-800 hover:bg-purple-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-4">
                  {currentScreen !== SCREENS.REVIEW ? (
                    <button 
                      type="button" 
                      onClick={nextScreen}
                      className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center space-x-2"
                    >
                      <span>Continue</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Submit Request</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
            </div>
          </div>
        </motion.div>
      </div>

      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Request Submitted Successfully!</h2>
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600"
                  >
                    <p>Thank you for your submission. Your request has been recorded and will be processed shortly.</p>
                  </motion.div>
                  <div className="mt-4 px-4 py-2 bg-purple-50 rounded-lg inline-block border border-purple-200">
                    <span className="text-sm text-purple-700 font-mono font-bold">{submitted.requestId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-8">
                  <div className="space-y-3">
                    <div><strong className="text-gray-700">Title:</strong> {submitted.title}</div>
                    <div><strong className="text-gray-700">Request Type:</strong> {submitted.requestType || '—'}</div>
                    <div><strong className="text-gray-700">Priority:</strong> {submitted.priorityLevel || '—'}</div>
                  </div>
                  <div className="space-y-3">
                    <div><strong className="text-gray-700">Requested By:</strong> {submitted.requestedBy}</div>
                    <div><strong className="text-gray-700">Organization:</strong> {submitted.organizationName}</div>
                    <div><strong className="text-gray-700">Attachments:</strong> {(submitted.attachmentList || []).length} files</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button 
                    className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-md"
                    onClick={() => setSubmitted(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RequestForm;