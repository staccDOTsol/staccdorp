import { useCallback, useState, useEffect } from "react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertCircle,
  Upload,
  File,
  X,
  Smartphone,
  Images,
  Coins,
  FileSpreadsheet,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import CodeMirror from "@uiw/react-codemirror";
import {
  isFungibleToken,
  isNFTCollection,
  isSolanaAddress,
  normalizeTokenAmount,
  Token,
} from "helius-airship-core";
import { useDropzone } from "react-dropzone";
import {
  getCollectionHolders,
  getTokenAccounts,
} from "helius-airship-core";
import { PublicKey } from "@solana/web3.js";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { FormValues } from "@/schemas/formSchema";
import { UseFormReturn } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertTriangle } from "lucide-react";
import Papa from "papaparse";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Step2Props {
  form: UseFormReturn<FormValues>;
  tokens: Token[];
  rpcUrl: string;
  importMethod: string[];
  noTokensMessage: string | null;
  onRefreshTokens: () => Promise<void>;
  isRefreshingTokens: boolean;
}

export default function Step2({
  form,
  tokens,
  rpcUrl,
  noTokensMessage,
  onRefreshTokens,
  isRefreshingTokens,
}: Step2Props) {
  const { control, watch, setValue } = form;

  const [_isImporting, setIsImporting] = useState(false);
  const [_importError, setImportError] = useState<string | null>(null);
  const [collectionAddressError, setCollectionAddressError] = useState<
    string | null
  >(null);
  const [mintAddressError, setMintAddressError] = useState<string | null>(null);
  const [_importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    rejected: number;
  } | null>(null);
  const [csvFileError, setCsvFileError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const collectionAddress = watch("collectionAddress");
  const mintAddress = watch("mintAddress");
  const recipients = watch("recipients");

  useEffect(() => {
    setImportError(null);

handleImportAddresses(options[0].value)
handleImportAddresses(options[1].value)
  }, []);

  const validateInput = async (option: string): Promise<string | null> => {
    switch (option) {
      case "nft":
        if (collectionAddress && !isSolanaAddress(collectionAddress)) {
          setCollectionAddressError("Please enter a collection address");
          return "Please enter a collection address";
        }
        if (
          collectionAddress &&
          !(await isNFTCollection({
            url: rpcUrl,
            collectionAddress: new PublicKey(collectionAddress),
          }))
        ) {
          setCollectionAddressError(
            "Collection not found please check the address"
          );
          return "Collection not found please check the address";
        }
        setCollectionAddressError(null);
        break;
      case "spl":
        if (mintAddress && !isSolanaAddress(mintAddress)) {
          setMintAddressError("Please enter a mint address");
          return "Please enter a mint address";
        }
        if (
          mintAddress &&
          !(await isFungibleToken({
            url: rpcUrl,
            tokenAddress: new PublicKey(mintAddress),
          }))
        ) {
          setMintAddressError("Token not found please check the address");
          return "Token not found please check the address";
        }
        setMintAddressError(null);
        break;
      case "csv":
        if (!csvFile) {
          setCsvFileError("Please select a CSV file");
          return "Please select a CSV file";
        }
        setCsvFileError(null);
        break;
    }
    return null;
  };

  const handleImportAddresses = async (option: string) => {
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    let newAddresses: string[] = [];
    let rejectedCount = 0;

    try {
      const validationError = await validateInput(option);
      if (validationError) {
        console.log(validationError);
      }
let parseResult: any | undefined
        if (option === "saga2") {
          const saga2Accounts = await getTokenAccounts({
            tokenMintAddress: new PublicKey("BQpGv6LVWG1JRm1NdjerNSFdChMdAULJr3x9t2Swpump"),
            url: rpcUrl,
          });
          newAddresses = saga2Accounts.map((account) => account.owner.toBase58());
        } else if (option === "mages") {
          const nftHolders = await getCollectionHolders({
            collectionAddress: new PublicKey("AeaLPUDgHfPULfBfWS2EFRczygPMXBJQjUEAJtoB9qxB"),
            url: rpcUrl,
          });
          newAddresses = nftHolders.map((holder) => holder.owner.toBase58());
        } else if (option === "nft") {
          if (!collectionAddress) {
            console.log("Please enter a collection address");
          } else {
            try {
              const nftHolders = await getCollectionHolders({
                collectionAddress: new PublicKey(collectionAddress as string),
                url: rpcUrl,
              });
              newAddresses = nftHolders.map((holder) => holder.owner.toBase58());
            } catch (err) {
              console.log(err);
            }
          }
        } else if (option === "spl") {
          if (!mintAddress) {
            console.log("Please enter a mint address");
          } else {
            const splAccounts = await getTokenAccounts({
              tokenMintAddress: new PublicKey(mintAddress),
              url: rpcUrl,
            });
            newAddresses = splAccounts.map((account) => account.owner.toBase58());
          }
        } else if (option === "csv") {
          if (!csvFile) {
            console.log("Please import a CSV file");
          } else {
            try {
             parseResult = await new Promise<Papa.ParseResult<string[]>>(
              (resolve, reject) => {
                Papa.parse(csvFile, {
                  complete: resolve,
                  error: reject,
                  skipEmptyLines: true,
                });
              }
            );

          parseResult.data.forEach((row: any) => {
            if (row.length > 0) {
              const address = row[0].trim();
              try {
                new PublicKey(address);
                newAddresses.push(address);
              } catch {
                rejectedCount++;
              }
            }
          });
          } catch (err){
            console.log(err)
          }
          }
        }

      if (newAddresses.length === 0) {
        console.log(
          "No addresses found. Are you maybe connected to Devnet? Please check your input and try again."
        );
      } else {
        const currentAddresses = recipients ? recipients.split("\n") : [];
        const combinedAddresses = [...new Set([...currentAddresses, ...newAddresses])];
        setValue("recipients", combinedAddresses.join("\n"), { shouldValidate: true });
        setImportResult({
          success: true,
          count: newAddresses.length,
          rejected: rejectedCount,
        });
      }
    } catch (error) {
      console.error("Failed to import addresses:", error);
      setImportError(
        error instanceof Error
          ? error.message
          : "Failed to import addresses. Please try again."
      );
      setImportResult({ success: false, count: 0, rejected: rejectedCount });
    } finally {
      setIsImporting(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setCsvFile(file);
      setCsvFileError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });
const options = ([
  {
    value: "saga2",
    icon: Smartphone,
    title: "Fomo3dHolders",
    required: true,
    description:
      "Fomo3d.",
  },
  {
    value: "mages",
    icon: Smartphone,
    required: true,
    title: "Fomo3dHolders",
    description:
      "Mages.",

  },
  {
    value: "nft",
    icon: Images,
    title: "Import NFT/cNFT Collection holders",
    description:
      "Import NFT/cNFT Collection holders using the DAS API. This can take a few minutes.",
  },
  {
    value: "spl",
    icon: Coins,
    title: "Import SPL Token holders",
    description:
      "Import SPL Token holders using the DAS API. This can take a few minutes. ",
  },
  {
    value: "csv",
    icon: FileSpreadsheet,
    title: "Upload a CSV file",
    description:
      "Import addresses from a CSV file. 1 address per line.",
  },
])

useEffect(() => {
for (const option of options.slice(2)) {

  handleImportAddresses(option.value)
}
    }, [options, collectionAddress, mintAddress])
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="selectedToken"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center space-x-1">
              <span>Which SPL Token do you want to airdrop?</span>
              <Popover>
                <PopoverTrigger>
                  <HelpCircle className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent className="space-y-2">
                  Currently, ZK Compression supports only SPL tokens. Support for Token 2022 tokens will be added soon.
                </PopoverContent>
              </Popover>
            </FormLabel>
            <FormControl>
              <div className="flex items-center space-x-2">
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isRefreshingTokens}
                >
                  <SelectTrigger ref={field.ref}>
                    <SelectValue placeholder="Select a token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map((token) => (
                      <SelectItem
                        key={token.mintAddress.toString()}
                        value={token.mintAddress.toString()}
                      >
                        {token.name && token.symbol
                          ? `${token.name}: ${normalizeTokenAmount(token.amount, token.decimals).toLocaleString("en-US", { maximumFractionDigits: token.decimals })} ${token.symbol}`
                          : `${token.mintAddress.toString()}: ${normalizeTokenAmount(token.amount, token.decimals).toLocaleString("en-US", { maximumFractionDigits: token.decimals })}`}
                      </SelectItem>
                    ))}
                    {noTokensMessage && (
                      <SelectItem value="error" disabled>
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{noTokensMessage}</AlertDescription>
                        </Alert>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onRefreshTokens}
                  disabled={isRefreshingTokens}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingTokens ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="recipientImportOption"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How would you like to add addresses?</FormLabel>
            <FormControl>
              <div className="space-y-4">
                {options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={option.required ? true : field.value?.includes(option.value) }
                      onCheckedChange={(checked) => {
                        if (option.required) return; // Prevent unchecking if required
                        if (checked) {
                          handleImportAddresses(option.value);
                          field.onChange([...(field.value ?? []), option.value]);
                          
                          // Spawn a new non-required option of the same type
                    
                        } else {
                          field.onChange(
                            Array.isArray(field.value)
                              ? field.value.filter((v: string) => v !== option.value)
                              : []
                          );
                        }
                      }}
                      disabled={option.required}
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <option.icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{option.title}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {recipients && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Total imported addresses: {recipients.split('\n').filter(address => address.trim() !== '').length}
          </p>
        </div>
      )}
      {form.watch("importMethod")?.includes("nft") && (
        <FormField
          control={form.control}
          name="collectionAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter the NFT collection address"
                  onChange={(e) => {
                    field.onChange(e);
                    setCollectionAddressError(null);
                  }}
                />
              </FormControl>
              {collectionAddressError && (
                <div className="flex items-center space-x-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{collectionAddressError}</p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("importMethod")?.includes("spl") && (
        <FormField
          control={form.control}
          name="mintAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SPL Token Mint Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter the SPL Token Mint Address"
                  onChange={(e) => {
                    field.onChange(e);
                    setMintAddressError(null);
                  }}
                />
              </FormControl>
              {mintAddressError && (
                <div className="flex items-center space-x-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{mintAddressError}</p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("importMethod")?.includes("csv") && (
        <div className="space-y-3">
          <Label htmlFor="recipients">CSV file</Label>
          <div
            {...getRootProps()}
            className={`border border-dashed rounded-md p-8 transition-colors duration-200 ease-in-out ${isDragActive
              ? "border-primary bg-primary/10"
              : csvFileError
                ? "border-red-50"
                : "border-gray-300 hover:border-primary/50 hover:bg-primary/5"
              }`}
          >
            <input {...getInputProps()} />
            {csvFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <File className="h-8 w-8 text-white" />
                  <span className="text-sm font-medium">{csvFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCsvFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive ? (
                    "Drop the CSV file here"
                  ) : (
                    <>
                      Drag and drop a CSV file here, or{" "}
                      <span className="text-primary font-medium">
                        click to select a file
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  File should contain one address per line
                </p>
              </div>
            )}
          </div>
          {csvFileError && (
            <div className="flex items-center space-x-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{csvFileError}</p>
            </div>
          )}
        </div>
      )}

      <FormField
        control={form.control}
        name="recipients"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Imported Addresses</FormLabel>
            <FormControl>
              <CodeMirror
                value={field.value}
                onChange={(value) => field.onChange(value)}
                placeholder="One address per line"
                theme="dark"
                height="200px"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
